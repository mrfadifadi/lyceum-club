import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol aria-label="Sign up progress" className="flex items-start">
      {steps.map((label, i) => {
        const done = i < current, active = i === current;
        return (
          <li key={label} aria-current={active ? "step" : undefined} className={cn("relative flex flex-1 flex-col items-center gap-2 text-center",)}>
            {i > 0 && <span aria-hidden className="absolute right-1/2 top-4 -z-0 h-px w-full bg-line"><span className={cn("block h-full origin-left bg-fg transition-transform duration-500", i <= current ? "scale-x-100" : "scale-x-0")} /></span>}
            <span className={cn("relative z-10 grid h-8 w-8 place-items-center rounded-full border text-sm font-medium transition-colors duration-300",
              done ? "border-fg bg-fg text-bg" : active ? "border-fg bg-bg text-fg" : "border-line bg-bg text-muted")}>
              {done ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
              <span className="sr-only">{done ? " (completed)" : active ? " (current)" : ""}</span>
            </span>
            <span className={cn("text-xs", active ? "text-fg" : "text-muted", !active && "max-sm:sr-only")}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
