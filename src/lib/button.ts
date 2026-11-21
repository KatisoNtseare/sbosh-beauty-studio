import { cva } from "class-variance-authority";

export const buttonStyles = cva(
  "inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full px-8 text-[13px] font-semibold tracking-normal normal-case transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        solid: "bg-gold text-white hover:bg-gold-dark",
        outline: "border-[1.5px] border-gold text-gold hover:bg-gold hover:text-white",
      },
    },
    defaultVariants: { variant: "solid" },
  }
);
