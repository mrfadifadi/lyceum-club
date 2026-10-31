import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select ref={ref} className={cn(
      "h-11 w-full appearance-none rounded-lg border border-line bg-bg pl-3 pr-10 text-sm text-fg transition-shadow",
      "focus-visible:border-fg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-fg/25 aria-[invalid=true]:border-fg disabled:cursor-not-allowed disabled:opacity-50", className)} {...props}>{children}</select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
  </div>
));
Select.displayName = "Select";
