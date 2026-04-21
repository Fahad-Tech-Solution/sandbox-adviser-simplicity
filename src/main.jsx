import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { App as AntdApp, ConfigProvider } from "antd";
import { Provider as JotaiProvider } from "jotai";
import { BrowserRouter, HashRouter } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { appStore } from "./store/jotaiStore";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        token: {
          /* here is your global tokens */
          colorPrimary: "#22c55e",
        },
      }}
    >
      <JotaiProvider store={appStore}>
        <AntdApp>
          <HashRouter>
            <App />
          </HashRouter>
        </AntdApp>
      </JotaiProvider>
    </ConfigProvider>
  </StrictMode>,
);
