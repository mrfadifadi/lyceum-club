import { useEffect, useRef } from "react";

/** Adds `.is-visible` once the element scrolls into view (CSS handles the animation). */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return el.classList.add("is-visible");
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add("is-visible"); io.disconnect(); } }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}
