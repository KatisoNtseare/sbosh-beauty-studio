import { cva } from "class-variance-authority";

export const buttonStyles = cva(
  "inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full px-8 text-[13px] font-semibold tracking-normal normal-case transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-berry disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        solid: "bg-strong-pink text-charcoal shadow-sm hover:bg-raised-surface hover:text-silver",
        outline: "border-[1.5px] border-brand-pink text-deep-berry hover:bg-pale-blush",
      },
    },
    defaultVariants: { variant: "solid" },
  }
);
