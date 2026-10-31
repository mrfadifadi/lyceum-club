import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Layout } from "@/components/layout/Layout";
import "../index.css";

/** Every HTML page has its own tiny entry file that calls this with its page component. */
export function mount(page: ReactNode, withLayout = true) {
  createRoot(document.getElementById("root")!).render(<StrictMode>{withLayout ? <Layout>{page}</Layout> : page}</StrictMode>);
}
