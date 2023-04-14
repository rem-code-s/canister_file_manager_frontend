import React, { PropsWithChildren, createContext, useContext, useEffect } from "react";
import Methods from "src/api/methods";
import { FileResponse } from "src/declarations/file_manager/file_manager.did";
import { getFileChunks } from "src/helpers/fileHelper";

export interface IFileData {
  file: File;
  fileDetails: FileResponse;
}

export interface IChunk {
  id: bigint;
  bytes: number[];
}

interface IFileContext {
  processingChunks: bigint[];
  totalChunksToProcess: number;
  files: IFileData[];
  setFiles: (files: IFileData[]) => void;
}

export const FileContextValue = createContext<IFileContext>({
  files: [],
  setFiles: () => {},
  processingChunks: [],
  totalChunksToProcess: 0,
});

export default function FileContextProvider({ children }: PropsWithChildren<{}>) {
  const [state, setState] = React.useState<IFileContext>({
    files: [],
    setFiles,
    processingChunks: [],
    totalChunksToProcess: 0,
  });

  useEffect(() => {
    if (state.files.length > 0) {
      processChunks();
    }
  }, [state.files]);

  async function processChunks() {
    try {
      // get chunks for each file
      let result = await Promise.all(state.files.map(async (file) => await getFileChunks(file)));
      let chunks: IChunk[] = result.flat();
      setState((prevState) => ({ ...prevState, totalChunksToProcess: chunks.length }));

      let sizedChunkGroup = groupChunkBytesUnder2Mb(chunks);
      const promises = sizedChunkGroup.map(async (chunks) => {
        try {
          let chunksData: [bigint, number[]][] = chunks.map((chunk) => [chunk.id, chunk.bytes]);
          setState((prevState) => ({
            ...prevState,
            processingChunks: [...prevState.processingChunks, ...chunksData.map((c) => c[0])],
          }));
          await Methods.addChunks(chunksData);
          setState((prevState) => ({
            ...prevState,
            processingChunks: prevState.processingChunks.filter((c) => !chunksData.map((c) => c[0]).includes(c)),
          }));
        } catch (error) {
          console.log(error);
        }
      });
      await Promise.all(promises);
    } catch (error) {
      console.log(error);
    } finally {
      setState((prevState) => ({ ...prevState, totalChunksToProcess: 0, files: [] }));
    }
  }

  function groupChunkBytesUnder2Mb(chunks: IChunk[]): IChunk[][] {
    let groupedChunks: IChunk[][] = [];
    let currentGroup: IChunk[] = [];
    let currentGroupSize = 0;
    let notAddedChunks = chunks.map((c) => c.id);

    // group chunks under 2mb and add the rest to the last group
    chunks.forEach(({ id, bytes }) => {
      if (currentGroupSize + bytes.length >= 2_000_000) {
        groupedChunks.push(currentGroup);
        currentGroup = [{ id, bytes }];
        currentGroupSize = bytes.length;
      } else {
        currentGroup.push({ id, bytes });
        currentGroupSize += bytes.length;
        notAddedChunks = notAddedChunks.filter((c) => c !== id);
      }
    });

    if (currentGroup.length > 0 && currentGroupSize < 2_000_000 && currentGroupSize > 0) {
      groupedChunks.push(currentGroup);
    }

    return groupedChunks;
  }

  function setFiles(files: IFileData[]) {
    setState((prevState) => ({ ...prevState, files }));
  }

  return <FileContextValue.Provider value={state}>{children}</FileContextValue.Provider>;
}

export function useFile() {
  return useContext(FileContextValue);
}
