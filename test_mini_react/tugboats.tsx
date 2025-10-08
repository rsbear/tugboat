import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import * as input from "@tugboats/core";

// The App now receives the Harbor API as a prop, allowing it to interact
// with the main application shell.
function App() {
  const [thing, setThing] = React.useState("");
  useEffect(() => {
    async function yup() {
      const inputval = await input.value();
      console.log("mini_react_inputval", inputval);
    }
    yup();
  }, []);
  return (
    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">
        Your installed mini apps
      </h1>
      <input
        type="text"
        value={thing}
        onChange={(e) => setThing(e.target.value)}
      />
      <div>react state value: {thing}</div>
    </div>
  );
}

export const tugboatsMini = "react";
export function tugboatReact(targetElement: HTMLElement) {
  const root = ReactDOM.createRoot(targetElement);
  root.render(<App />);
}
