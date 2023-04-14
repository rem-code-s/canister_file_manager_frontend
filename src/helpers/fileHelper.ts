import { IChunk, IFileData } from "src/context/FileContext";
import { NestedAssets, PostAsset } from "src/declarations/file_manager/file_manager.did";

export interface FileWithPath {
  file: File;
  path: string;
}
export interface InputDataResult {
  assets: NestedAssets[];
  files: File[];
  totalBytes: number;
}

// TODO: Clean up this function
export function handleFileInputFromEvent(event: React.ChangeEvent<HTMLInputElement>): InputDataResult {
  const target_files = event.target.files;
  if (target_files) {
    const files = Object.values(target_files);
    const totalBytes = files.reduce((acc, file) => acc + file.size, 0);
    const mappedFiles = mapfilesToAssets(files);

    if (mappedFiles.every((f) => f.file.webkitRelativePath === "")) {
      let data: InputDataResult = { assets: [], files: [], totalBytes: 0 };
      mappedFiles.forEach((f) => {
        const asset: NestedAssets = {
          asset: {
            File: f.fileAsset.File,
          },
          children: [],
        };
        data.assets.push(asset);
        data.files.push(f.file);
        data.totalBytes = totalBytes;
      });
      return data;
    } else {
      const dirs = getDirsFromFiles(files);

      let uniqueDirs: { pathSections: string[]; paths: string[] }[] = [];

      dirs.forEach((dir) => {
        const existing = uniqueDirs.find((d) => d.pathSections.join("/") === dir.pathSections.join("/"));
        if (existing) {
          dir.path && existing.paths.push(dir.path);
        } else {
          uniqueDirs.push({
            paths: dir.path ? [dir.path] : [],
            pathSections: dir.pathSections,
          });
        }
      });
      console.log(uniqueDirs);

      // move folder to corresponding parent folder using NestedArray
      const assets: NestedAssets[] = [];
      const filesWithPath: File[] = [];

      uniqueDirs.forEach((dir) => {
        let current = assets;
        dir.pathSections.forEach((folder) => {
          const existing = current.find((d) => {
            if ("Directory" in d.asset) {
              return d.asset.Directory.name === folder;
            }
            return false;
          });
          if (existing) {
            current = existing.children;
          } else {
            const newDirectory: NestedAssets = {
              asset: {
                Directory: {
                  name: folder,
                  permission: {
                    Public: null,
                  },
                  parent_id: [],
                  children: [],
                },
              },
              children: [],
            };
            current.push(newDirectory);
            current = newDirectory.children;
          }
        });
        dir.paths.forEach((path) => {
          const fileAsset = mappedFiles.find((f) => f.file.webkitRelativePath === path);
          if (fileAsset) {
            current.push({ asset: { File: fileAsset.fileAsset.File }, children: [] });
            filesWithPath.push(fileAsset.file);
          }
        });
      });

      return { assets, files: filesWithPath, totalBytes };
    }
  }
  return { assets: [], files: [], totalBytes: 0 };
}

export async function getFileChunks(data: IFileData): Promise<IChunk[]> {
  const buffer = await data.file.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);

  let payload = Array.from(uint8Array);
  let chunks: {
    id: bigint;
    bytes: number[];
  }[] = [];
  const chunkSize = 999_999; // size in bytes

  let index = 0;
  for (let i = 0; i < payload.length; i += chunkSize) {
    chunks.push({
      id: data.fileDetails.chunks[index],
      bytes: payload.slice(i, i + chunkSize),
    });
    index++;
  }

  return chunks;
}

export function getFileChunkCount(file: File) {
  let chunks = 0;
  const chunkSize = 999_999; // size in bytes

  for (let i = 0; i < file.size; i += chunkSize) {
    chunks++;
  }

  return chunks;
}

export function mapDirectoryToAsset(directoryName: string) {
  const directoryAsset: NestedAssets = {
    asset: {
      Directory: {
        name: directoryName,
        permission: {
          Public: null,
        },
        parent_id: [],
        children: [],
      },
    },
    children: [],
  };

  return directoryAsset;
}

export function mapfilesToAssets(files: File[]) {
  return files.map((file) => {
    const splitted_name = file.name.split(".");
    let extension = splitted_name[splitted_name.length - 1];
    const path = file.webkitRelativePath;

    const fileAsset: PostAsset = {
      File: {
        name: file.name,
        extension,
        size: BigInt(file.size),
        permission: {
          Public: null,
        },
        parent_id: [],
        chunk_count: BigInt(getFileChunkCount(file)),
        metadata: [],
        mime_type: file.type,
        origin_path: path,
      },
    };

    return { fileAsset, file };
  });
}

export function getDirsFromFiles(files: File[]) {
  return files.map((file) => {
    const path = file.webkitRelativePath;
    const pathSections = path.split("/");
    pathSections.pop();
    return { pathSections, path };
  });
}
