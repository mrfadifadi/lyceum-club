import { useMemo } from "react";
import { cn } from "@/lib/utils";

/**
 * Random Letter Swap — pure CSS version (no animation library, no layout glitches).
 * Each letter sits in a clipped cell holding a stack: [real letter, random letter, real letter].
 * On hover/focus of the HOST (the parent <a>/<button> with class `lswap-host`) the stack rolls up
 * through the random letter and lands on the real one, staggered left → right.
 * The label therefore always reads correctly, before, during the end of, and after the animation.
 * Reduced motion: the global reduced-motion rule makes the roll instant.
 */
interface Props { label: string; className?: string; staggerDuration?: number }

export function RandomLetterSwap({ label, className, staggerDuration = 0.03 }: Props) {
  const cells = useMemo(() => {
    const pool = (label.replace(/[^\p{L}]/gu, "") + "abcdefghijklmnopqrstuvwxyz").split("");
    return label.split("").map((ch) => {
      if (!/\p{L}/u.test(ch)) return { ch, alt: ch };
      let alt = ch;
      while (alt.toLowerCase() === ch.toLowerCase()) alt = pool[Math.floor(Math.random() * pool.length)];
      return { ch, alt: ch === ch.toUpperCase() ? alt.toUpperCase() : alt.toLowerCase() };
    });
  }, [label]);

  return (
    <span className={cn("lswap", className)} style={{ ["--st" as string]: `${staggerDuration}s` }}>
      <span className="sr-only">{label}</span>
      <span aria-hidden className="lswap-row">
        {cells.map((c, i) =>
          c.ch === " " ? <span key={i} className="lswap-cell">{"\u00A0"}</span> : (
            <span key={i} className="lswap-cell" style={{ ["--i" as string]: i }}>
              <span className="lswap-ghost">{c.ch}</span>
              <span className="lswap-stack"><span>{c.ch}</span><span>{c.alt}</span><span>{c.ch}</span></span>
            </span>
          ))}
      </span>
    </span>
  );
}
