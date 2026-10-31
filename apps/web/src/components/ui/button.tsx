import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-300 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "group relative isolate overflow-hidden border border-fg bg-fg text-bg hover:text-fg hover:shadow-[var(--shadow-glow)] before:absolute before:inset-0 before:-z-10 before:origin-left before:scale-x-0 before:bg-bg before:transition-transform before:duration-300 before:ease-[var(--ease)] hover:before:scale-x-100 focus-visible:before:scale-x-100 focus-visible:text-fg",
        outline: "border border-line bg-transparent text-fg hover:border-fg hover:bg-fg hover:text-bg",
        ghost: "text-muted hover:text-fg hover:bg-surface-2",
        link: "text-fg underline-offset-4 hover:underline rounded-none px-0",
      },
      size: { default: "h-11 px-6", sm: "h-9 px-4", lg: "h-12 px-8 text-base", icon: "h-11 w-11" },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";
export { buttonVariants };
