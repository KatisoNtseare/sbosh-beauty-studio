import { cva } from "class-variance-authority";

export const buttonStyles = cva(
  "inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full px-8 text-[13px] font-semibold tracking-normal normal-case transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        solid: "bg-pink-primary text-white shadow-sm hover:bg-plum",
        outline: "border-[1.5px] border-pink-primary text-plum hover:bg-pink-blush",
      },
    },
    defaultVariants: { variant: "solid" },
  }
);
