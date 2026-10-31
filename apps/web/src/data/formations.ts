import type { Formation } from "@/types/content";
const s = { isSample: true, body: ["Sample content — replace with the real formation description."] };
export const formations: Formation[] = [
  { ...s, id: "f1", slug: "sample-formation-1", title: "Sample Formation — Public Speaking", excerpt: "Placeholder formation to preview the card.", category: "Soft skills", duration: "4 sessions (placeholder)", status: "open" },
  { ...s, id: "f2", slug: "sample-formation-2", title: "Sample Formation — Research Basics", excerpt: "Placeholder formation to preview the card.", category: "Academic", duration: "3 sessions (placeholder)", status: "upcoming" },
  { ...s, id: "f3", slug: "sample-formation-3", title: "Sample Past Formation — Study Methods", excerpt: "Placeholder past formation.", category: "Academic", duration: "2 sessions (placeholder)", status: "past" },
];
