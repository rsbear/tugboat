import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";

import { input } from "@tugboats/core";


// The App now receives the Harbor API as a prop, allowing it to interact
// with the main application shell.
export default function App() {
  const [thing, setThing] = React.useState("");
  const [lastSubmit, setLastSubmit] = React.useState<
    {
      raw: string;
      alias: string;
      query: string;
    } | null
  >(null);

  useEffect(() => {
    const unsubscribe = input.subscribe((value) => {
      console.log("input value", value);
      setThing(value.raw);
    });

    // Register submit handler
    const unregisterSubmit = input.onSubmit(({ raw, alias, query }) => {
      console.log("🎯 Submit handler called!", { raw, alias, query });
      setLastSubmit({ raw, alias, query });
    });

    return () => {
      unsubscribe();
      unregisterSubmit();
    };
  }, []);

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">
        deno is dope
      </h1>
      <input
        type="text"
        value={thing}
        onChange={(e) => setThing(e.target.value)}
      />
      <div>react state value: {thing}</div>

      {lastSubmit && (
        <div className="mt-4 p-4 bg-green-900/50 border border-green-700 rounded">
          <h2 className="text-lg font-semibold text-green-300">Last Submit:</h2>
          <div className="text-white space-y-1 mt-2">
            <div>
              <span className="font-bold">Raw:</span> {lastSubmit.raw}
            </div>
            <div>
              <span className="font-bold">Alias:</span> {lastSubmit.alias}
            </div>
            <div>
              <span className="font-bold">Query:</span> {lastSubmit.query}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
