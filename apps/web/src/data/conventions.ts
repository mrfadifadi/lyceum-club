import type { Convention } from "@/types/content";
const s = { isSample: true, body: ["Sample content — do not publish. Replace with official convention information."] };
export const conventions: Convention[] = [
  { ...s, id: "c1", slug: "sample-convention-1", title: "Sample Convention — Partner Organisation", excerpt: "Placeholder convention to preview the layout.", category: "Partnership", date: "2026-12-10", location: "Batna (placeholder)", partner: "Partner name (placeholder)" },
  { ...s, id: "c2", slug: "sample-convention-2", title: "Sample Past Convention", excerpt: "Placeholder past convention.", category: "Partnership", date: "2026-05-14", location: "Batna (placeholder)", partner: "Partner name (placeholder)" },
];
