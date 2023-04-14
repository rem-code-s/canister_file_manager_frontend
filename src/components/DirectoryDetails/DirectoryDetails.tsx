import { Cancel, Folder } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import React from "react";
import Methods from "src/api/methods";
import { useGlobal } from "src/context/GlobalContext";
import { DirectoryResponse } from "src/declarations/file_manager/file_manager.did";

interface IProps {
  directory: DirectoryResponse | null;
  onClose: () => void;
}

export default function DirectoryDetails({ directory, onClose }: IProps) {
  const { setIsLoading, getAssets, principal } = useGlobal();
  if (!directory) {
    return null;
  }

  async function deleteDirectory(directoryId: bigint) {
    try {
      setIsLoading(true);
      onClose();
      await Methods.deleteDirectory(directoryId);
      await getAssets([]);
    } catch (error) {
      alert(error);
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }

  const directoryCount = directory.children.filter((child) => "Directory" in child).length;
  const files = directory.children.filter((child) => "File" in child);
  const totalFilesBytes = files.reduce((acc, file) => acc + ("File" in file ? Number(file.File.size) : 0), 0);
  const totalFilesMb = (totalFilesBytes / 1_000_000).toFixed(2) + " MB";
  const canDelete = !directory.is_protected && directory.owner.toString() === principal;

  return (
    <Dialog fullWidth onClose={onClose} open={!!directory}>
      <Box sx={{ display: "flex", flexDirection: "row" }}>
        <DialogTitle sx={{ display: "flex", flexGrow: 1, alignItems: "center" }}>
          <Folder sx={{ mr: 1 }} />
          {directory.name}
        </DialogTitle>
        <IconButton onClick={onClose}>
          <Cancel />
        </IconButton>
      </Box>
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
