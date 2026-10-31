import { PageHeading, Section, SectionHeading } from "@/components/shared/Headings";
import { ConventionCard } from "@/components/shared/Cards";
import { EmptyState, LoadingState } from "@/components/shared/Placeholders";
import { useAsync } from "@/hooks/useAsync";
import { getConventions } from "@/services/api";

const startOfToday = () => new Date(new Date().toDateString());

export default function Conventions() {
  const { data, loading } = useAsync(getConventions);
  const up = (data ?? []).filter((c) => new Date(c.date) >= startOfToday());
  const past = (data ?? []).filter((c) => new Date(c.date) < startOfToday());
  const grid = (l: typeof up) => <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{l.map((c, i) => <ConventionCard key={c.id} convention={c} delay={i * 0.06} />)}</div>;
  return (
    <>
      <PageHeading eyebrow="Conventions" title="Partnerships & agreements" text="Conventions the club takes part in. Entries marked “Sample” are placeholders, not official information." />
      <Section>
        {loading ? <LoadingState /> : (<>
          <SectionHeading title="Upcoming" />
          {up.length ? grid(up) : <EmptyState title="No upcoming conventions" text="Nothing scheduled yet." />}
          <div className="mt-20"><SectionHeading title="Past" /></div>
          {past.length ? grid(past) : <EmptyState title="No past conventions" text="Nothing archived yet." />}
        </>)}
      </Section>
    </>
  );
}
