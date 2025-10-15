import { init } from "npm:modern-monaco";
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useRef,
  useState,
} from "preact/compat";
import type { ComponentChildren } from "preact";

// -- Monaco Editor Context

type MonacoCtxType = null | Awaited<ReturnType<typeof init>>;
const MonacoCtx = createContext<MonacoCtxType>(null);

export const useMonacoCtx = () => {
  const c = useContext(MonacoCtx);
  if (!c) throw new Error("no monaco");
  return c;
};

export const MonacoCtxProvider = (props: { children: ComponentChildren }) => {
  const [mon, setMon] = useState<MonacoCtxType>(null);
  useEffect(() => {
    init().then(setMon);
  }, []);
  return <MonacoCtx.Provider value={mon}>{props.children}</MonacoCtx.Provider>;
};

type Langs =
  | "toml"
  | "json"
  | "typescript"
  | "typescriptreact"
  | "javascript"
  | "javascriptreact"
  | "css"
  | "html"
  | "markdown";

// -- Editor hook with signal-like API

export const useEditorValue = (initialCode: string, lang: Langs = "json") => {
  const monaco = useMonacoCtx();
  const editorRef = useRef<any>(null);
  const [code, setCode] = useState(initialCode);

  const getValue = () => editorRef.current?.getValue() ?? code;
  const setValue = (newCode: string) => {
    setCode(newCode);
    if (editorRef.current) {
      editorRef.current.setValue(newCode);
    }
  };

  return {
    code,
    getValue,
    setValue,
    ref: editorRef,
    _lang: lang,
  };
};

// -- Monaco Editor Component

export const Editor = forwardRef<
  HTMLDivElement,
  { value: ReturnType<typeof useEditorValue> }
>((props, ref) => {
  const monaco = useMonacoCtx();
  const containerRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<any>(null);

  // Merge refs
  useEffect(() => {
    if (ref) {
      if (typeof ref === "function") ref(containerRef.current);
      else ref.current = containerRef.current;
    }
    if (props.value.ref) {
      props.value.ref.current = editorInstanceRef.current;
    }
  }, [ref, props.value.ref]);

  useEffect(() => {
    if (!monaco) throw new Error("no monaco");
    if (!containerRef.current) return;

    const editor = monaco.editor.create(containerRef.current);
    editor.setModel(
      monaco.editor.createModel(props.value.code, props.value._lang),
    );

    editorInstanceRef.current = editor;

    editor.onDidChangeModelContent(() => {
      props.value.setValue(editor.getValue());
    });

    return () => {
      editor.dispose();
      editorInstanceRef.current = null;
    };
  }, [monaco, props.value._lang]);

  useEffect(() => {
    if (
      editorInstanceRef.current &&
      props.value.code !== editorInstanceRef.current.getValue()
    ) {
      editorInstanceRef.current.setValue(props.value.code);
    }
  }, [props.value.code]);

  return (
    <div
      style={{ height: "400px" }}
      class="w-full"
      id="monaco-editor"
      ref={containerRef}
    />
  );
});
