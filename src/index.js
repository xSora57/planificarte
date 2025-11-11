import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";
import "bootstrap-icons/font/bootstrap-icons.css";

// ✅ React busca el elemento con id="root" en index.html
const root = ReactDOM.createRoot(document.getElementById("root"));

// ✅ Aquí se “inyecta” toda la aplicación React dentro del <div id="root">
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
