import ListView from "./components/ListView/ListView";
import { Box } from "@mui/material";
import Bottombar from "./components/Bottombar/Bottombar";
import Topbar from "./components/Topbar/Topbar";

function App() {
  return (
    <Box sx={{ overflow: "hidden" }}>
      <Box sx={{ height: 60 }}>
        <Topbar />
      </Box>
      <Box sx={{ overflow: "scroll", height: "calc(100vh - (60px + 24px))" }}>
        <ListView />
      </Box>
      <Box sx={{ height: 24 }}>
        <Bottombar />
      </Box>
    </Box>
  );
}

export default App;
