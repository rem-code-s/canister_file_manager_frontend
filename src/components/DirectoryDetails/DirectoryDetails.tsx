import { Cancel, Edit, Folder, Save } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import Methods from "src/api/methods";
import { useGlobal } from "src/context/GlobalContext";
import { DirectoryResponse } from "src/declarations/file_manager/file_manager.did";
import { truncate } from "src/helpers/stringHelper";

interface IProps {
  directory: DirectoryResponse | null;
  onClose: () => void;
}

export default function DirectoryDetails({ directory, onClose }: IProps) {
  const { setIsLoading, getAssets, principal } = useGlobal();
  const [title, setTitle] = useState<string>("");
  const [titleEditMode, setTitleEditMode] = useState(false);
  const [isChangingName, setIsChangingName] = useState(false);

  useEffect(() => {
    if (directory) {
      setTitle(directory.name);
    }
  }, [directory]);

  if (!directory) {
    return null;
  }

  async function handleNameChange() {
    try {
      setIsChangingName(true);
      if (directory) {
        await Methods.changeAssetName(title, { Directory: directory.id });
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsChangingName(false);
      setTitleEditMode(false);
      getAssets([]);
    }
  }

  async function deleteDirectory(directoryId: bigint) {
    try {
      setIsLoading(true);
      onClose();
      await Methods.deleteAsset({ Directory: directoryId });
      await getAssets([]);
    } catch (error) {
      alert(error);
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }

  function renderTitle() {
    const isOwner = directory?.owner.toString() === principal;
    return (
      <DialogTitle sx={{ display: "flex", mx: -1, flexGrow: 1, flexDirection: "row", alignItems: "center" }}>
        <Folder sx={{ mr: 1 }} color="secondary" />
        {titleEditMode && isOwner ? (
          <TextField disabled={isChangingName} size="small" value={title} onChange={(e) => setTitle(e.target.value)} />
        ) : (
          <>{title.length > 20 ? truncate(title, 20) : title}</>
        )}
        {titleEditMode ? (
          isChangingName ? (
            <CircularProgress sx={{ ml: 2 }} size={24} />
          ) : (
            <Box sx={{ ml: 2 }}>
              <IconButton size="small" onClick={handleNameChange} disabled={isChangingName}>
                <Save />
              </IconButton>
              <IconButton size="small" onClick={() => setTitleEditMode(false)} disabled={isChangingName}>
                <Cancel />
              </IconButton>
            </Box>
          )
        ) : (
          <Box>
            {isOwner && (
              <IconButton sx={{ ml: 2 }} size="small">
                <Edit onClick={() => setTitleEditMode((prevState) => !prevState)} />
              </IconButton>
            )}
          </Box>
        )}
      </DialogTitle>
    );
  }

  const directoryCount = directory.children.filter((child) => "Directory" in child).length;
  const files = directory.children.filter((child) => "File" in child);
  const totalFilesBytes = files.reduce((acc, file) => acc + ("File" in file ? Number(file.File.size) : 0), 0);
  const totalFilesMb = (totalFilesBytes / 1_000_000).toFixed(2) + " MB";
  const canDelete = !directory.is_protected && directory.owner.toString() === principal;

  return (
    <Dialog fullWidth onClose={onClose} open={!!directory}>
      <Box sx={{ display: "flex", flexDirection: "row" }}>{renderTitle()}</Box>
      <DialogContent sx={{ padding: 2, display: "flex", justifyContent: "center" }}>
        <List>
          <ListItem>
            <ListItemText primary={directoryCount} secondary="Directory count" />
          </ListItem>
          <ListItem>
            <ListItemText primary={`${files.length} (${totalFilesMb})`} secondary="File count" />
          </ListItem>
          <ListItem>
            <ListItemText primary={directory.owner.toString()} secondary={"Owner"} />
          </ListItem>
        </List>
      </DialogContent>
      <DialogActions>
        <Button disabled={!canDelete} variant="contained" color="error" onClick={() => deleteDirectory(directory.id)}>
          {!canDelete ? <>Delete</> : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
