import { routes } from "@/lib/routes";
import { PageHeading, Section, SectionHeading } from "@/components/shared/Headings";
import { FormationCard } from "@/components/shared/Cards";
import { EmptyState, LoadingState } from "@/components/shared/Placeholders";
import { Button } from "@/components/ui/button";
import { useAsync } from "@/hooks/useAsync";
import { getFormations } from "@/services/api";

export default function Formations() {
  const { data, loading } = useAsync(getFormations);
  const current = (data ?? []).filter((f) => f.status !== "past");
  const past = (data ?? []).filter((f) => f.status === "past");
  const grid = (list: typeof current) => <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{list.map((f, i) => <FormationCard key={f.id} formation={f} delay={i * 0.06} />)}</div>;
  return (
    <>
      <PageHeading eyebrow="Formations" title="Learn something new" text="Workshops and learning opportunities run by the club. Entries marked “Sample” are placeholders." />
      <Section>
        {loading ? <LoadingState /> : (<>
          <SectionHeading title="Available & upcoming" />
          {current.length ? grid(current) : <EmptyState title="No formations at the moment" text="New formations will be announced here." />}
          <div className="mt-20"><SectionHeading title="Past formations" /></div>
          {past.length ? grid(past) : <EmptyState title="No past formations" text="Nothing archived yet." />}
          <p className="mt-12 text-sm text-muted">Online registration isn't available yet. <Button asChild variant="link" size="sm"><a href={routes.joinUs}>Join the club</a></Button> to stay in the loop.</p>
        </>)}
      </Section>
    </>
  );
}
