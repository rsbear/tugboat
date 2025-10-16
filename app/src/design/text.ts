import { tv } from "tailwind-variants";

export const title = tv({
  base: "font-mono text-xs tracking-wider",
  variants: {
    type: {
      main: "text-stone-900",
      sub: "text-stone-900/60",
    },
    uppercase: {
      true: "uppercase",
    },
  },
  defaultVariants: {
    type: "main",
  },
});
