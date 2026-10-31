import { useMemo, useState } from "react";
import { PageHeading, Section, SectionHeading } from "@/components/shared/Headings";
import { EventCard } from "@/components/shared/Cards";
import { EmptyState, LoadingState } from "@/components/shared/Placeholders";
import { useAsync } from "@/hooks/useAsync";
import { getEvents } from "@/services/api";
import { cn } from "@/lib/utils";

const startOfToday = () => new Date(new Date().toDateString());

export default function Events() {
  const { data, loading } = useAsync(getEvents);
  const [cat, setCat] = useState("All");
  const cats = useMemo(() => ["All", ...new Set((data ?? []).map((e) => e.category))], [data]);
  const filtered = (data ?? []).filter((e) => cat === "All" || e.category === cat);
  const upcoming = filtered.filter((e) => new Date(e.date) >= startOfToday()).sort((a, b) => a.date.localeCompare(b.date));
  const past = filtered.filter((e) => new Date(e.date) < startOfToday()).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <PageHeading eyebrow="Events" title="What's happening" text="Upcoming gatherings and a look back at past events. Entries marked “Sample” are placeholders." />
      <Section>
        {loading ? <LoadingState /> : (<>
          <div role="group" aria-label="Filter by category" className="mb-12 flex flex-wrap gap-2">
            {cats.map((c) => (
              <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)}
                className={cn("rounded-full border px-4 py-2 text-sm transition-colors", cat === c ? "border-fg bg-fg text-bg" : "border-line text-muted hover:text-fg")}>{c}</button>))}
          </div>
          <SectionHeading title="Upcoming" />
          {upcoming.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{upcoming.map((e, i) => <EventCard key={e.id} event={e} delay={i * 0.06} />)}</div> : <EmptyState title="No upcoming events" text="Nothing scheduled in this category yet." />}
          <div className="mt-20"><SectionHeading title="Past events" /></div>
          {past.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{past.map((e, i) => <EventCard key={e.id} event={e} delay={i * 0.06} />)}</div> : <EmptyState title="No past events" text="Past events will be archived here." />}
        </>)}
      </Section>
    </>
  );
}
