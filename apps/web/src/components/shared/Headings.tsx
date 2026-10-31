import type { ReactNode } from "react";
import { GridBackdrop } from "./GridBackdrop";
import { Reveal } from "./Reveal";

export function PageHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <header className="relative overflow-hidden border-b border-line pb-16 pt-36">
      <GridBackdrop />
      <div className="container-x relative">
        <p className="hero-in text-xs uppercase tracking-[0.2em] text-zinc-400">{eyebrow}</p>
        <h1 className="hero-in font-display mt-3 text-4xl font-semibold sm:text-6xl" style={{ ["--d" as string]: ".1s" }}>{title}</h1>
        <p className="hero-in mt-5 max-w-2xl text-lg text-muted" style={{ ["--d" as string]: ".2s" }}>{text}</p>
      </div>
    </header>
  );
}
export function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">{eyebrow}</p>}
        <h2 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">{title}</h2>
      </div>
      {action}
    </Reveal>
  );
}
export const Section = ({ children, alt }: { children: ReactNode; alt?: boolean }) => (
  <section className={`py-20 ${alt ? "border-y border-line bg-surface" : ""}`}><div className="container-x">{children}</div></section>
);
