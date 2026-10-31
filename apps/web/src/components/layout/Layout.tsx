import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

/** Shared chrome for every page except Join Us. Each HTML file mounts its own copy. */
export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-fg focus:px-4 focus:py-2 focus:text-bg">Skip to content</a>
      <Navbar />
      <main id="main" className="page-enter">{children}</main>
      <Footer />
    </>
  );
}
