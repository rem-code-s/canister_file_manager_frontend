import { Box, Button, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useGlobal } from "src/context/GlobalContext";
import { AuthClient } from "@dfinity/auth-client";
import { Principal } from "@dfinity/principal";
import { useFile } from "src/context/FileContext";
import Loading from "../Loading/Loading";
import logoLarge from "../../assets/logo_large.png";

export default function Topbar() {
  const { isLoading, setPrincipal } = useGlobal();
  const { processingChunks, totalChunksToProcess } = useFile();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log(processingChunks.length);
  }, [processingChunks]);

  useEffect(() => {
    verififyConnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verififyConnect() {
    try {
      const authClient = await AuthClient.create();
      const identity = authClient.getIdentity();
      if (identity.getPrincipal().isAnonymous()) {
        setIsConnected(false);
      } else {
        setIsConnected(true);
      }
      console.log(identity.getPrincipal().toString());
      setPrincipal(authClient.getIdentity().getPrincipal().toString());
    } catch (error) {
      console.log(error);
    }
  }
  async function login() {
    try {
      const authClient = await AuthClient.create();
      authClient.login({
        // 7 days in nanoseconds
        maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000),
        onSuccess: async () => {
          setPrincipal(authClient.getIdentity().getPrincipal().toString());
          setIsConnected(true);
        },
      });
    } catch (error) {
      setIsConnected(false);
      console.log(error);
    }
  }

  async function logout() {
    try {
      const authClient = await AuthClient.create();
      await authClient.logout();
      setPrincipal(Principal.anonymous().toString());
      setIsConnected(false);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <Box
      sx={{
        pl: 2,
        pr: 1,
        alignItems: "center",
        justifyContent: "space-between",
        display: "flex",
        flexGrow: 1,
        height: "100%",
        background: (theme) => theme.palette.primary.light,
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", pt: 0.5 }}>
        <img height={32} alt="rem.codes" src={logoLarge} />
        <Typography sx={{ mt: -0.9 }} variant="caption">
          Canister file manager
        </Typography>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
        {totalChunksToProcess > 0 && (
          <Typography sx={{ mr: 2 }} variant="caption">
            {totalChunksToProcess - processingChunks.length} / {totalChunksToProcess} chunks processed
          </Typography>
        )}
        {isLoading ? (
          <Loading />
        ) : !isConnected ? (
          <Button size="large" variant="contained" color="primary" onClick={login}>
            Login
          </Button>
        ) : (
          <Button size="large" variant="outlined" color="secondary" onClick={logout}>
            Logout
          </Button>
        )}
      </Box>
    </Box>
  );
}
