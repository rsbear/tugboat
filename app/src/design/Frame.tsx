import { ComponentChildren } from "preact";

export function Frame(props: { children: ComponentChildren }) {
  return (
    <div className="ring-2 ring-black/30 rounded-lg">
      {props.children}
    </div>
  );
}
