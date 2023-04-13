import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { ThemeProvider } from "@mui/material";
import { theme } from "./misc/theme";
import GlobalContextProvider from "./context/GlobalContext";
import FileContextProvider from "./context/FileContext";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <GlobalContextProvider>
        <FileContextProvider>
          <App />
        </FileContextProvider>
      </GlobalContextProvider>
    </ThemeProvider>
  </React.StrictMode>
);
