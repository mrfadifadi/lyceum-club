import type { ReactNode } from "react";
import { useReveal } from "@/hooks/useReveal";
import { cn } from "@/lib/utils";

type Variant = "up" | "left" | "right" | "zoom";
const v: Record<Variant, string> = { up: "", left: "reveal-left", right: "reveal-right", zoom: "reveal-zoom" };

/** Scroll-triggered entrance. Wrap anything; it animates once when it enters the viewport. */
export function Reveal({ children, delay = 0, variant = "up", className }: { children: ReactNode; delay?: number; variant?: Variant; className?: string }) {
  const ref = useReveal<HTMLDivElement>();
  return <div ref={ref} className={cn("reveal", v[variant], className)} style={{ ["--d" as string]: `${delay}s` }}>{children}</div>;
}
