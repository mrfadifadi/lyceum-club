import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 w-full rounded-lg border border-line bg-bg px-3 text-sm text-fg placeholder:text-zinc-600 transition-shadow",
        "focus-visible:border-fg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/25",
        "aria-[invalid=true]:border-fg disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
