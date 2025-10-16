import { tv } from "tailwind-variants";

export const content = tv({
  base: "px-3",
  variants: {
    frame: {
      true: "ring-1 ring-gray-500/50 rounded-sm px-0 mx-3",
    },
    y: {
      "3": "py-3",
    },
    x: {
      "3": "px-3",
    },
  },
});
