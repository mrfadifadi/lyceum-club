import "@testing-library/jest-dom/vitest";

// jsdom lacks these browser APIs
class IO { observe() {} unobserve() {} disconnect() {} }
(globalThis as any).IntersectionObserver = IO;
window.matchMedia = window.matchMedia || ((q: string) => ({
  matches: false, media: q, onchange: null, addEventListener() {}, removeEventListener() {},
  addListener() {}, removeListener() {}, dispatchEvent: () => false,
}));
window.scrollTo = () => {};
HTMLCanvasElement.prototype.getContext = (() => null) as any;
