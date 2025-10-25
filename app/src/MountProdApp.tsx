import { useEffect, useRef } from "preact/hooks";
import { injectImportMap, mountNewPattern, tryLegacyMount } from "./mount_utils.ts";

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

        // 1. Get bundle path and metadata
        const path = await invoke("latest_bundle_for_alias", { alias });
        console.log("🚢 DEBUG: Bundle path received:", path);

        // 2. Try to fetch metadata (contains framework and import map)
        let metadata: any = null;
        try {
          metadata = await invoke("read_bundle_metadata", { alias });
          console.log("🚢 DEBUG: Metadata loaded:", metadata);
        } catch (metaErr) {
          console.warn("🚢 DEBUG: No metadata found, assuming legacy bundle");
        }

        // 3. Inject import map if available
        if (metadata?.importmap) {
          injectImportMap(alias, metadata.importmap);
        }

        // 4. Load bundle
        const code = await invoke("read_text_file", { path });
        console.log("🚢 DEBUG: Bundle code length:", code?.length || 0);

        const blob = new Blob([code], { type: "text/javascript" });
        const url = URL.createObjectURL(blob);
        console.log("🚢 DEBUG: Created blob URL:", url);

        const mod = await import(url);
        URL.revokeObjectURL(url);
        console.log("🚢 DEBUG: Module imported, exports:", Object.keys(mod));

        if (!mounted || !slotRef.current) return;

        const slot = slotRef.current;
        let cleanup: (() => void) | null = null;

        // 5. Try new pattern first (if metadata exists)
        if (metadata?.framework && mod.default) {
          console.log("🚢 DEBUG: Using new pattern with framework:", metadata.framework);
          cleanup = await mountNewPattern(mod, metadata.framework, slot, alias);
        } else {
          // 6. Fall back to legacy patterns
          console.log("🚢 DEBUG: Trying legacy mount patterns");
          cleanup = await tryLegacyMount(mod, slot);
          
          if (!cleanup) {
            console.warn(
              "No recognized mount pattern found in bundle for alias:",
              alias,
            );
          }
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
