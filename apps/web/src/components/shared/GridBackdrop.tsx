import { useEffect, useRef } from "react";

/** Animated grid lines + subtle rising particles (adapted from the supplied auth component).
 *  Canvas loop pauses when the tab is hidden and is skipped entirely for reduced motion. */
export function GridBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current, ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ps: { x: number; y: number; v: number; o: number }[] = [], raf = 0;
    const make = (y = Math.random() * canvas.height) => ({ x: Math.random() * canvas.width, y, v: Math.random() * 0.25 + 0.05, o: Math.random() * 0.35 + 0.15 });
    const init = () => {
      canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
      ps = Array.from({ length: Math.min(160, Math.floor((canvas.width * canvas.height) / 9000)) }, () => make());
    };
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of ps) {
        p.y -= p.v;
        if (p.y < 0) Object.assign(p, make(canvas.height + Math.random() * 40));
        ctx.fillStyle = `rgba(250,250,250,${p.o})`;
        ctx.fillRect(p.x, p.y, 0.7, 2.2);
      }
      raf = requestAnimationFrame(draw);
    };
    const onVis = () => { cancelAnimationFrame(raf); if (!document.hidden) raf = requestAnimationFrame(draw); };
    init(); raf = requestAnimationFrame(draw);
    window.addEventListener("resize", init); document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", init); document.removeEventListener("visibilitychange", onVis); };
  }, []);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 [background:radial-gradient(80%_60%_at_50%_30%,rgba(255,255,255,0.06),transparent_60%)]" />
      <div className="accent-lines"><div className="hline" /><div className="hline" /><div className="hline" /><div className="vline" /><div className="vline" /><div className="vline" /></div>
      <canvas ref={ref} className="absolute inset-0 h-full w-full opacity-50 mix-blend-screen" />
    </div>
  );
}
