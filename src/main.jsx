import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { autoLoginAdmin } from "./services/auth";
import "./App.css";

const root = createRoot(document.getElementById("root"));

root.render(
  <div style={{ padding: 16, fontFamily: "Inter, sans-serif" }}>
    Đang kết nối hệ thống...
  </div>,
);

autoLoginAdmin()
  .catch((error) => {
    console.error("Auto login admin failed:", error);
  })
  .finally(() => {
    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>,
    );
  });