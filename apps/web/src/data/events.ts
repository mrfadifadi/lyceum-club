import type { ClubEvent } from "@/types/content";
const s = { isSample: true, body: ["Sample content — replace with the real event description."] };
export const events: ClubEvent[] = [
  { ...s, id: "e1", slug: "sample-event-1", title: "Sample Event — Open Evening", excerpt: "Placeholder event used to preview the layout.", category: "Community", date: "2026-11-20", location: "Batna (placeholder)" },
  { ...s, id: "e2", slug: "sample-event-2", title: "Sample Event — Discussion Night", excerpt: "Placeholder event used to preview the layout.", category: "Discussion", date: "2026-12-05", location: "Batna (placeholder)" },
  { ...s, id: "e3", slug: "sample-event-3", title: "Sample Event — Club Meetup", excerpt: "Placeholder event used to preview the layout.", category: "Community", date: "2027-01-15", location: "Batna (placeholder)" },
  { ...s, id: "e4", slug: "sample-event-4", title: "Sample Past Event — Welcome Day", excerpt: "Placeholder past event.", category: "Community", date: "2026-09-12", location: "Batna (placeholder)" },
  { ...s, id: "e5", slug: "sample-event-5", title: "Sample Past Event — Workshop Night", excerpt: "Placeholder past event.", category: "Workshop", date: "2026-06-03", location: "Batna (placeholder)" },
];
