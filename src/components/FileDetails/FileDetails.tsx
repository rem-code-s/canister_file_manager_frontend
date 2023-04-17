import { AudioFile, Cancel, Description, Edit, InsertDriveFile, Photo, Save, VideoFile } from "@mui/icons-material";
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
import { FileResponse } from "src/declarations/file_manager/file_manager.did";
import { dateFromNano } from "src/helpers/dateHelper";
import { truncate } from "src/helpers/stringHelper";

interface IProps {
  file: FileResponse | null;
  onClose: () => void;
}

export default function FileDetails({ file, onClose }: IProps) {
  const { setIsLoading, getAssets, principal } = useGlobal();
  const [text, setText] = useState("");
  const [title, setTitle] = useState<string>("");
  const [titleEditMode, setTitleEditMode] = useState(false);
  const [isChangingName, setIsChangingName] = useState(false);

  useEffect(() => {
    if (file) {
      setTitle(file.name.split(`.${file.extension}`)[0]);
    }
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
      await Methods.deleteAsset({ File: fileId });
      await getAssets([]);
    } catch (error) {
      alert(error);
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleNameChange() {
    try {
      setIsChangingName(true);
      if (file) {
        await Methods.changeAssetName(title + `.${file.extension}`, { File: file.id });
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsChangingName(false);
      setTitleEditMode(false);
      getAssets([]);
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

  function handleClose() {
    onClose();
    setText("");
    setTitleEditMode(false);
  }

  function getIconForFileType(file: FileResponse) {
    const isImage = file.mime_type.startsWith("image/");
    const isVideo = file.mime_type.startsWith("video/");
    const isAudio = file.mime_type.startsWith("audio/");
    const isText = file.mime_type.startsWith("text/") || file?.mime_type.startsWith("application/json");

    if (isImage) return <Photo sx={{ mr: 1 }} color="secondary" />;
    if (isVideo) return <VideoFile sx={{ mr: 1 }} color="secondary" />;
    if (isAudio) return <AudioFile sx={{ mr: 1 }} color="secondary" />;
    if (isText) return <Description sx={{ mr: 1 }} color="secondary" />;
    else {
      return <InsertDriveFile sx={{ mr: 1 }} color="secondary" />;
    }
  }

  function renderTitle(file: FileResponse) {
    const isOwner = file?.owner.toString() === principal;
    return (
      <DialogTitle sx={{ display: "flex", mx: -1, flexGrow: 1, flexDirection: "row", alignItems: "center" }}>
        {getIconForFileType(file)}
        {titleEditMode && isOwner ? (
          <TextField
            disabled={isChangingName}
            size="small"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            InputProps={{ endAdornment: `.${file.extension}` }}
          />
        ) : (
          <>{title.length > 20 ? truncate(title, 20) + " " + file.extension : file.name}</>
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

  function renderContent(file: FileResponse) {
    const isImage = file.mime_type.startsWith("image/");
    const isVideo = file.mime_type.startsWith("video/");
    const isAudio = file.mime_type.startsWith("audio/");
    const isText = file.mime_type.startsWith("text/") || file?.mime_type.startsWith("application/json");

    const path = window.location.origin + "/" + file.path;
    if (isImage) {
      return <img width={"100%"} src={path} alt={file.name} />;
    } else if (isVideo) {
      return <video width={"100%"} src={path} controls />;
    } else if (isAudio) {
      return <audio src={path} controls />;
    } else if (isText) {
      if (file.mime_type.startsWith("text/html")) {
        return (
          <iframe
            title={file.name}
            style={{ border: "none", width: "100%", height: 200, overflow: "scroll" }}
            src={path}
          />
        );
      }
      return (
        <Box width={"100%"} height={200} overflow={"scroll"}>
          <code>{text}</code>
        </Box>
      );
    } else {
      return <p>Unsupported file type</p>;
    }
  }

  const totalFilesMb = (Number(file.size) / 1_000_000).toFixed(2);
  const totalFilesKb = (Number(file.size) / 1_000).toFixed(2);
  const fileSize = totalFilesMb === "0.00" ? totalFilesKb + " KB" : totalFilesMb + " MB";

  const canDelete = !file.is_protected && file.owner.toString() === principal;
  return (
    <Dialog fullWidth onClose={handleClose} open={!!file}>
      <Box sx={{ display: "flex", flexDirection: "row", px: 1 }}>
        {renderTitle(file)}
        <IconButton onClick={handleClose}>
          <Cancel />
        </IconButton>
      </Box>
      <DialogContent sx={{ padding: 2, display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", flexGrow: 1, justifyContent: "center" }}>{renderContent(file)}</Box>
        <List>
          <ListItem>
            <ListItemText primary={fileSize} secondary={"File size"} />
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
        <Button variant="outlined" component="a" href={window.location.origin + "/" + file.path} target="_blank">
          Open in new tab
        </Button>
      </DialogActions>
    </Dialog>
  );
}
