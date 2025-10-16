/**
 * Usage: <button class={btn({ type: "sm" })}>small button</button>
 *
 * In the future this will live in @tugboats/core/design
 */

import { tv, type VariantProps } from "tailwind-variants";

// Minimal button recipe
export const btn = tv({
  base:
    "inline-flex items-center justify-center shadow-sm transition-colors disabled:opacity-50 disabled:pointer-events-none",
  variants: {
    type: {
      xs: "px-2 py-[2px] rounded-[2px] text-xs text-white",
      sm: "px-3 py-1 rounded-[2px] text-sm text-white",
      md: "px-4 py-2 text-sm bg-neutral-900 text-white hover:bg-neutral-800",
      lg: "h-10 px-4 text-base bg-neutral-900 text-white hover:bg-neutral-800",
    },
    color: {
      emerald: "text-white bg-emerald-700 hover:bg-emerald-500",
      ghost:
        "bg-transparent hover:bg-transparent hover:ring-1 hover:ring-neutral-200",
    },
    font: {
      mono: "font-mono",
      sans: "font-sans",
    },
  },
  defaultVariants: {
    type: "md",
    color: "emerald",
    font: "mono",
  },
});

// Helpful type export for consumers
export type BtnVariants = VariantProps<typeof btn>;
