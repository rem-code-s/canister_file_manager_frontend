import React, { useEffect, useRef, useState } from "react";
import { Add, ChevronRight, CreateNewFolder, Folder, Info, InsertDriveFile, Lock } from "@mui/icons-material";
import {
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
} from "@mui/material";
import { truncate } from "src/helpers/stringHelper";
import { Asset, DirectoryResponse, FileResponse } from "src/declarations/file_hosting/file_hosting.did";
import { handleFileInputFromEvent } from "src/helpers/fileHelper";
import Methods from "src/api/methods";
import Loading from "../Loading/Loading";
import FileDetails from "../FileDetails/FileDetails";
import DirectoryDetails from "../DirectoryDetails/DirectoryDetails";
import CreateDirectory from "../CreateDirectory/CreateDirectory";
import { useGlobal } from "src/context/GlobalContext";
import { IFileData, useFile } from "src/context/FileContext";

interface IMenu {
  anchorEl: HTMLElement | null;
  id: [] | [bigint];
}

interface IRow {
  parentId: [] | [bigint];
  parentName: string;
  owner: string | null;
  assets: Asset[];
}

export default function ListView() {
  const { assets, getAssets, setIsLoading, principal } = useGlobal();
  const { setFiles, processingChunks } = useFile();
  const [rows, setRows] = useState<{ [row: number]: IRow }>({});
  const listRef = useRef<HTMLUListElement | null>(null);
  const [columnMenu, setColumnMenu] = useState<IMenu>({ anchorEl: null, id: [] });
  const [selectedFile, setSelectedFile] = useState<FileResponse | null>(null);
  const [selectedDirectory, setSelectedDirectory] = useState<DirectoryResponse | null>(null);
  const [createDirectoryParentId, setCreateDirectoryParentId] = useState<[] | [bigint] | null>(null);

  useEffect(() => {
    setRows({ 0: { parentId: [], parentName: "", owner: null, assets: assets } });
  }, [assets]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [rows]);

  useEffect(() => {
    if (processingChunks.length === 0) {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processingChunks]);

  function handleDirectoryClick(row: number, directory: DirectoryResponse) {
    setRows((prevState) => {
      // filter out all rows that are higher then row + 1
      Object.keys(prevState).forEach((key) => {
        if (Number(key) > row + 1) {
          delete prevState[Number(key)];
        }
      });
      return {
        ...prevState,
        [row + 1]: {
          parentId: [directory.id],
          parentName: directory.name,
          owner: directory.owner[0] ? directory.owner[0].toString() : null,
          assets: directory.children,
        },
      };
    });
  }

  async function handleDirectoryUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setIsLoading(true);
      let files = handleFileInputFromEvent(event);
      setColumnMenu((prevState) => ({ ...prevState, anchorEl: null }));

      const emptyFileResponse = await Methods.addAssets(columnMenu.id, files.assets);

      let fileData: IFileData[] = emptyFileResponse.map(([file, path]) => {
        return {
          file: files.files.find(
            (f) => f.webkitRelativePath === path && BigInt(f.size) === file.size && f.name === file.name
          )!,
          fileDetails: file,
        };
      });

      setFiles(fileData);
      await getAssets([]);
    } catch (error) {
      alert((error as any)[1]);
      console.log(error);
      setIsLoading(false);
    }
  }

  function renderColumnMenu() {
    return (
      <Menu
        anchorEl={columnMenu.anchorEl}
        open={Boolean(columnMenu.anchorEl)}
        onClose={() => setColumnMenu({ anchorEl: null, id: [] })}
      >
        <MenuItem component="label">
          <input type="file" multiple hidden onChange={handleDirectoryUpload} />
          <ListItemIcon>
            <InsertDriveFile />
          </ListItemIcon>
          Upload files
        </MenuItem>
        <MenuItem component="label">
          <input type="file" directory="" webkitdirectory="" hidden onChange={handleDirectoryUpload} />
          <ListItemIcon>
            <Folder />
          </ListItemIcon>
          Upload folder
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCreateDirectoryParentId(columnMenu.id);
            setColumnMenu((prevState) => ({ ...prevState, anchorEl: null }));
          }}
        >
          <ListItemIcon>
            <CreateNewFolder />
          </ListItemIcon>
          Create directory
        </MenuItem>
      </Menu>
    );
  }

  function renderAssets(rowData: IRow, row: number) {
    return rowData.assets.map((asset) => {
      if ("Directory" in asset) {
        const isProcessing = asset.Directory.children.some((p) => {
          if ("File" in p) {
            return processingChunks.some((c) => p.File.chunks.includes(c));
          }
          return false;
        });

        const isSelected = Object.values(rows).some((r) => r.parentId[0] === asset.Directory.id);
        const owned = principal === asset.Directory.owner.toString();
        return (
          <ListItemButton
            sx={isSelected ? { bgcolor: "secondary.dark" } : { opacity: owned ? 1 : 0.4 }}
            onClick={(e) => handleDirectoryClick(row, asset.Directory)}
            divider
            key={"dir" + asset.Directory.id}
          >
            <ListItemIcon>
              <Folder sx={!isSelected ? { color: (theme) => theme.palette.primary.main } : { color: "white" }} />
            </ListItemIcon>
            <ListItemText primary={asset.Directory.name} />
            <ListItemSecondaryAction sx={{ justifyContent: "center", display: "flex", alignItems: "center" }}>
              {asset.Directory.is_protected && <Lock sx={{ opacity: 0.3, mr: 1 }} />}
              {isProcessing ? (
                <Loading />
              ) : (
                <>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDirectory(asset.Directory);
                    }}
                    sx={{ color: "#ffffff", mr: 1 }}
                  >
                    <Info />
                  </IconButton>
                  <IconButton
                    size="small"
                    sx={
                      isSelected
                        ? { background: "#ffffff", color: (theme) => theme.palette.primary.main }
                        : { color: "#ffffff" }
                    }
                  >
                    <ChevronRight />
                  </IconButton>
                </>
              )}
            </ListItemSecondaryAction>
          </ListItemButton>
        );
      }
      const owned = principal === asset.File.owner.toString();
      return (
        <ListItemButton
          sx={{ opacity: owned ? 1 : 0.4 }}
          disabled={asset.File.chunks.some((c) => processingChunks.some((p) => p === c))}
          divider
          key={"file" + asset.File.id}
          onClick={() => setSelectedFile(asset.File)}
        >
          <ListItemIcon>
            {["gif", "jpg", "jpeg", "png", "svg", "webp", "ico"].includes(asset.File.extension) ? (
              <img alt={asset.File.name} width={24} src={window.location.href + asset.File.path} />
            ) : (
              <InsertDriveFile color="primary" />
            )}
          </ListItemIcon>
          <ListItemText
            primary={truncate(asset.File.name.split("." + asset.File.extension)[0], 10) + "." + asset.File.extension}
          />
          <IconButton sx={{ color: "#ffffff" }}>
            {processingChunks.some((p) => asset.File.chunks.includes(p)) && <Loading />}
            {asset.File.is_protected && <Lock sx={{ opacity: 0.3 }} />}
          </IconButton>
        </ListItemButton>
      );
    });
  }

  return (
    <>
      <Stack direction="row" display={"flex"} height="100%">
        {renderColumnMenu()}
        {Object.entries(rows).map(([row_id, row_data]) => (
          <List
            disablePadding
            ref={listRef}
            sx={{
              marginTop: -64,
              paddingTop: 64,
              overflowY: "auto",
              borderRight: "1px solid rgba(0, 0, 0, 0.12)",
              minWidth: 350,
              maxWidth: 350,
            }}
            key={row_id}
          >
            {(row_data.owner === principal || row_data.parentId[0] === undefined) && (
              <ListItemButton
                component="label"
                divider
                sx={{ height: 48, justifyContent: "center" }}
                onClick={(e) => setColumnMenu({ anchorEl: e.currentTarget, id: row_data.parentId })}
              >
                <Add color="secondary" />
              </ListItemButton>
            )}
            {renderAssets(row_data, Number(row_id))}
          </List>
        ))}
      </Stack>
      <FileDetails file={selectedFile} onClose={() => setSelectedFile(null)} />
      <DirectoryDetails directory={selectedDirectory} onClose={() => setSelectedDirectory(null)} />
      <CreateDirectory
        parentId={createDirectoryParentId}
        open={!!createDirectoryParentId}
        onClose={() => setCreateDirectoryParentId(null)}
      />
    </>
  );
}
