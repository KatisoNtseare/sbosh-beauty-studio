import { cva } from "class-variance-authority";

export const buttonStyles = cva(
  "inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full px-8 text-[12px] font-semibold uppercase tracking-[0.16em] transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-berry disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        solid:
          "bg-strong-pink text-charcoal shadow-[0_12px_28px_-12px_rgb(74_36_56/0.65)] hover:-translate-y-0.5 hover:bg-deep-berry",
        outline:
          "border-[1.5px] border-strong-pink/60 text-deep-berry hover:border-strong-pink hover:bg-pale-blush",
        light:
          "bg-brand-white text-deep-berry shadow-[0_12px_28px_-12px_rgb(0_0_0/0.5)] hover:-translate-y-0.5 hover:bg-rose-gold",
        ghostLight:
          "border border-charcoal/40 text-charcoal hover:border-rose-gold hover:text-rose-gold",
      },
    },
    defaultVariants: { variant: "solid" },
  }
);