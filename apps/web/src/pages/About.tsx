import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { PageHeading, Section, SectionHeading } from "@/components/shared/Headings";
import { Reveal } from "@/components/shared/Reveal";
import { club } from "@/data/club";

export default function About() {
  return (
    <>
      <PageHeading eyebrow="About us" title="Who is Lyceum Club?" text={club.intro} />
      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          {[["Mission", club.mission], ["Vision", club.vision]].map(([t, p], i) => (
            <Reveal key={t} delay={i * 0.08}><div className="h-full rounded-[var(--radius-card)] border border-line bg-surface p-8"><h2 className="font-display text-2xl font-semibold text-fg">{t}</h2><p className="mt-3 text-muted">{p}</p></div></Reveal>))}
        </div>
      </Section>
      <Section alt>
        <SectionHeading eyebrow="What guides us" title="Values & objectives" />
        <div className="grid gap-6 md:grid-cols-3">{club.values.map((v, i) => <Reveal key={v.title} delay={i * 0.08}><div className="h-full rounded-2xl border border-line bg-bg p-6"><h3 className="font-display text-xl font-semibold">{v.title}</h3><p className="mt-2 text-sm text-muted">{v.text}</p></div></Reveal>)}</div>
      </Section>
      <Section>
        <SectionHeading eyebrow="What we do" title="Activities & initiatives" />
        <ul className="grid gap-4 sm:grid-cols-2">{club.activities.map((a) => <li key={a} className="rounded-xl border border-line px-5 py-4">{a}</li>)}</ul>
      </Section>
      <Section alt>
        <SectionHeading eyebrow="Organisation" title="Team" />
        {club.team.length ? <ul className="grid gap-4 sm:grid-cols-3">{club.team.map((m) => <li key={m.name} className="rounded-xl border border-line p-5"><p className="font-medium">{m.name}</p><p className="text-sm text-muted">{m.role}</p></li>)}</ul>
          : <p className="text-muted">Placeholder: the team and organisational structure will be listed here once confirmed (edit <code>src/data/club.ts</code>).</p>}
      </Section>
      <section className="py-20 text-center"><div className="container-x"><h2 className="font-display text-3xl font-semibold">Want to be part of it?</h2><Button asChild size="lg" className="mt-6"><a href={routes.joinUs}>Join Us</a></Button></div></section>
    </>
  );
}
