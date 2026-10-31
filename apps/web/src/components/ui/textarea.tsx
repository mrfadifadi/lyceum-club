import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(
    "flex min-h-32 w-full resize-y rounded-lg border border-line bg-bg px-3 py-2.5 text-sm text-fg placeholder:text-zinc-600 transition-shadow",
    "focus-visible:border-fg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-fg/25 aria-[invalid=true]:border-fg", className)} {...props} />
));
Textarea.displayName = "Textarea";
