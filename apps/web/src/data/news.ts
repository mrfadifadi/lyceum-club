import type { NewsArticle } from "@/types/content";
const s = { isSample: true, body: ["Sample content — replace with the real announcement text.", "Second placeholder paragraph to preview the article layout."] };
export const news: NewsArticle[] = [
  { ...s, id: "n1", slug: "sample-announcement-1", title: "Sample Announcement — Featured Story", excerpt: "Placeholder featured announcement used to preview the editorial layout.", category: "Announcement", date: "2026-10-01", featured: true },
  { ...s, id: "n2", slug: "sample-announcement-2", title: "Sample Announcement — Club Update", excerpt: "Placeholder news item.", category: "Update", date: "2026-09-20" },
  { ...s, id: "n3", slug: "sample-announcement-3", title: "Sample Announcement — New Season", excerpt: "Placeholder news item.", category: "Announcement", date: "2026-09-05" },
];
