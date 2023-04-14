import { Cancel } from "@mui/icons-material";
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
import React, { useEffect, useState } from "react";
import Methods from "src/api/methods";
import { useGlobal } from "src/context/GlobalContext";
import { FileResponse } from "src/declarations/file_manager/file_manager.did";
import { dateFromNano } from "src/helpers/dateHelper";

interface IProps {
  file: FileResponse | null;
  onClose: () => void;
}

export default function FileDetails({ file, onClose }: IProps) {
  const { setIsLoading, getAssets, principal } = useGlobal();
  const [text, setText] = useState("");

  useEffect(() => {
    if (file?.mime_type.startsWith("text/") || file?.mime_type.startsWith("application/json")) {
      fetchText();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  if (!file) {
    return null;
  }

  async function deleteFile(fileId: bigint) {
    try {
      setIsLoading(true);
      onClose();
      await Methods.deleteFile(fileId);
      await getAssets([]);
    } catch (error) {
      alert(error);
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }

  function fetchText() {
    if (file) {
      return fetch(file?.path)
        .then((response) => response.text())
        .then((text) => {
          setText(text);
        });
    }
  }

  function renderContent(file: FileResponse) {
    const isImage = file.mime_type.startsWith("image/");
    const isVideo = file.mime_type.startsWith("video/");
    const isAudio = file.mime_type.startsWith("audio/");
    const isText =
      file.mime_type.startsWith("text/") ||
      file?.mime_type.startsWith("text/") ||
      file?.mime_type.startsWith("application/json");

    if (isImage) {
      return <img width={"100%"} src={window.location.href + file.path} alt={file.name} />;
    } else if (isVideo) {
      return <video width={"100%"} src={file.path} controls />;
    } else if (isAudio) {
      return <audio src={file.path} controls />;
    } else if (isText) {
      return (
        <Box width={"100%"} height={200} overflow={"scroll"}>
          <code>{text}</code>
        </Box>
      );
    } else {
      return <p>Unsupported file type</p>;
    }
  }

  const totalFilesMb = (Number(file.size) / 1_000_000).toFixed(2) + " MB";
  const canDelete = !file.is_protected && file.owner.toString() === principal;
  return (
    <Dialog fullWidth onClose={onClose} open={!!file}>
      <Box sx={{ display: "flex", flexDirection: "row" }}>
        <DialogTitle sx={{ flexGrow: 1 }}>{file.name}</DialogTitle>
        <IconButton onClick={onClose}>
          <Cancel />
        </IconButton>
      </Box>
      <DialogContent sx={{ padding: 2, display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", flexGrow: 1, justifyContent: "center" }}>{renderContent(file)}</Box>
        <List>
          <ListItem>
            <ListItemText primary={totalFilesMb} secondary={"File size"} />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={dateFromNano(file.created_at).toJSDate().toLocaleString()}
              secondary={"Uploaded at"}
            />
          </ListItem>
          <ListItem>
            <ListItemText primary={file.owner.toString()} secondary={"Owner"} />
          </ListItem>
        </List>
      </DialogContent>
      <DialogActions sx={{ display: "flex", justifyContent: "right" }}>
        <Button
          disabled={!canDelete}
          variant="contained"
          color="error"
          sx={{ mr: 1 }}
          onClick={() => deleteFile(file.id)}
        >
          {!canDelete ? <>Delete</> : "Delete"}
        </Button>
        <Button variant="outlined" component="a" href={file.path} target="_blank">
          Open in new tab
        </Button>
      </DialogActions>
    </Dialog>
  );
}
