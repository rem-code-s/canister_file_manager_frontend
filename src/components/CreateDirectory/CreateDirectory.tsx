import { Cancel, CreateNewFolder } from "@mui/icons-material";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField } from "@mui/material";
import React from "react";
import Methods from "src/api/methods";
import { useGlobal } from "src/context/GlobalContext";

interface IProps {
  parentId: [] | [bigint] | null;
  open: boolean;
  onClose: () => void;
}

export default function CreateDirectory({ parentId, open, onClose }: IProps) {
  const { setIsLoading, getAssets } = useGlobal();
  const [name, setName] = React.useState<string>("");

  async function createDirectory() {
    try {
      setIsLoading(true);
      if (name && parentId !== null) {
        onClose();
        await Methods.createDirectory(name, parentId);
        setName("");
        await getAssets([]);
      }
    } catch (error) {
      alert(error);
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleClose() {
    setName("");
    onClose();
  }

  return (
    <Dialog fullWidth onClose={handleClose} open={open}>
      <Box sx={{ display: "flex", flexDirection: "row" }}>
        <DialogTitle sx={{ display: "flex", flexGrow: 1, alignItems: "center" }}>
          <CreateNewFolder sx={{ mr: 1 }} />
          Create new folder
        </DialogTitle>
        <IconButton onClick={onClose}>
          <Cancel />
        </IconButton>
      </Box>
      <DialogContent sx={{ padding: 2, display: "flex", justifyContent: "center" }}>
        <TextField fullWidth label="Directory name" value={name} onChange={(e) => setName(e.target.value)} />
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={createDirectory}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
