import { useEffect, useRef } from "preact/hooks";

// @ts-ignore - sh
const { invoke } = window.__TAURI__.core;

export function MountProdApp(props: { alias: string }) {
  const slotRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const alias = props.alias;
    if (!alias) return;

    let mounted = true;

    const mountBundle = async () => {
      try {
        console.log("🚢 DEBUG: Invoking latest_bundle_for_alias with:", alias);

        // Find latest bundle for alias
        const path = await invoke("latest_bundle_for_alias", { alias });
        console.log("🚢 DEBUG: Bundle path received:", path);

        const code = await invoke("read_text_file", { path });
        console.log("🚢 DEBUG: Bundle code length:", code?.length || 0);

        // Import the ESM bundle via blob URL
        const blob = new Blob([code], { type: "text/javascript" });
        const url = URL.createObjectURL(blob);
        console.log("🚢 DEBUG: Created blob URL:", url);

        const mod = await import(url);
        console.log("🚢 DEBUG: Module imported, exports:", Object.keys(mod));

        if (!mounted || !slotRef.current) return;

        const slot = slotRef.current;
        let cleanup: (() => void) | null = null;

        if (mod && typeof mod.harborMount === "function") {
          console.log("🚢 DEBUG: Using harborMount");
          mod.harborMount(slot);
          if (typeof mod.unmount === "function") {
            cleanup = () => {
              try {
                mod.unmount();
              } catch {}
            };
          }
        } else if (mod && typeof mod.tugboatReact === "function") {
          console.log("🚢 DEBUG: Using tugboatReact");
          const res = mod.tugboatReact(slot);
          if (typeof res === "function") cleanup = res;
        } else if (mod && typeof mod.tugboatSvelte === "function") {
          console.log("🚢 DEBUG: Using tugboatSvelte");
          const res = mod.tugboatSvelte(slot);
          if (typeof res === "function") cleanup = res;
        } else if (mod && typeof mod.default === "function") {
          console.log("🚢 DEBUG: Using default export");
          const res = mod.default(slot);
          if (typeof res === "function") cleanup = res;
        } else {
          console.warn(
            "No recognized tugboat/harbor mount export found in bundle for alias:",
            alias,
          );
        }

        cleanupRef.current = cleanup;
        console.log("🚢 DEBUG: Successfully mounted tugboat for alias:", alias);
      } catch (err) {
        console.error("Failed to mount tugboat app for alias", alias, err);
      }
    };

    mountBundle();

    // Cleanup function
    return () => {
      mounted = false;
      if (cleanupRef.current) {
        try {
          cleanupRef.current();
        } catch {}
        cleanupRef.current = null;
      }
      if (slotRef.current) {
        slotRef.current.innerHTML = "";
      }
    };
  }, [props.alias]);

  return (
    <div>
      <h2>Production Tugboat: {props.alias}</h2>
      <div ref={slotRef} id="prod-tugboat-slot"></div>
    </div>
  );
}
