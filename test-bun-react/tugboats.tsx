import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./app";

export function tugboatReact(targetElement: HTMLElement) {
  const root = ReactDOM.createRoot(targetElement);
  root.render(<App />);
  return root;
}
