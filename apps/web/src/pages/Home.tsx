import { routes } from "@/lib/routes";
import { ArrowRight, BookOpen, Users, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";
import { GridBackdrop } from "@/components/shared/GridBackdrop";
import { Section, SectionHeading } from "@/components/shared/Headings";
import { Reveal } from "@/components/shared/Reveal";
import { EventCard, NewsCard, FormationCard, ConventionCard } from "@/components/shared/Cards";
import { EmptyState, LoadingState } from "@/components/shared/Placeholders";
import { PinterestGallery } from "@/components/shared/PinterestGallery";
import { useAsync } from "@/hooks/useAsync";
import { getConventions, getEvents, getFormations, getNews } from "@/services/api";
import { club } from "@/data/club";

const more = (to: string, label: string) => <Button asChild variant="ghost"><a href={to}>{label}<ArrowRight className="h-4 w-4" aria-hidden /></a></Button>;
const Grid = ({ children }: { children: React.ReactNode }) => <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
const today = () => new Date(new Date().toDateString());

export default function Home() {
  const ev = useAsync(getEvents), nw = useAsync(getNews), fm = useAsync(getFormations), cv = useAsync(getConventions);
  const upcoming = (ev.data ?? []).filter((e) => new Date(e.date) >= today()).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  const latest = [...(nw.data ?? [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const forms = (fm.data ?? []).filter((f) => f.status !== "past").slice(0, 3);
  const conv = (cv.data ?? []).filter((c) => new Date(c.date) >= today())[0] ?? cv.data?.[0];

  return (
    <>
      <section className="relative isolate flex min-h-[100svh] items-center overflow-hidden pt-24">
        <GridBackdrop />
        <div className="container-x relative grid items-center gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="hero-in text-xs uppercase tracking-[0.25em] text-fg">{club.city}</p>
            <h1 className="hero-in font-display mt-4 text-5xl font-semibold leading-[1.05] sm:text-7xl" style={{ ["--d" as string]: ".12s" }}>
              Lyceum Club <span className="text-zinc-400">Batna</span>
            </h1>
            <p className="hero-in mt-6 max-w-xl text-lg text-muted" style={{ ["--d" as string]: ".24s" }}>{club.intro}</p>
            <div className="hero-in mt-9 flex flex-wrap gap-3" style={{ ["--d" as string]: ".36s" }}>
              <Button asChild size="lg"><a href={routes.joinUs}>Join Us<ArrowRight className="h-4 w-4" aria-hidden /></a></Button>
              <Button asChild size="lg" variant="outline"><a href={routes.about}>Learn more</a></Button>
            </div>
          </div>
          <div className="hero-in hidden justify-self-center lg:block" style={{ ["--d" as string]: ".3s" }}>
            <Logo variant="full" className="h-[26rem] drop-shadow-[0_0_60px_rgba(255,255,255,0.12)] motion-safe:animate-[float_7s_ease-in-out_infinite]" />
          </div>
        </div>
        <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}`}</style>
      </section>

      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal><SectionHeading eyebrow="Who we are" title="A club built around its students" />
            <p className="-mt-4 text-lg text-muted">{club.intro}</p>
            <div className="mt-6">{more(routes.about, "About the club")}</div></Reveal>
          <Reveal delay={0.1}><div className="grid gap-4 sm:grid-cols-3">
            {[{ i: BookOpen, t: "Formations" }, { i: Users, t: "Events" }, { i: Handshake, t: "Conventions" }].map(({ i: I, t }) => (
              <div key={t} className="rounded-2xl border border-line bg-surface p-5"><I className="h-6 w-6 text-fg" aria-hidden /><p className="mt-4 font-medium">{t}</p></div>))}
          </div></Reveal>
        </div>
      </Section>

      <Section alt>
        <SectionHeading eyebrow="Don't miss" title="Upcoming events" action={more(routes.events, "All events")} />
        {ev.loading ? <LoadingState /> : upcoming.length ? <Grid>{upcoming.map((e, i) => <EventCard key={e.id} event={e} delay={i * 0.08} />)}</Grid> : <EmptyState title="No upcoming events" text="New events will appear here as soon as they are announced." />}
      </Section>

      <Section>
        <SectionHeading eyebrow="Stay informed" title="Latest news" action={more(routes.news, "All news")} />
        {nw.loading ? <LoadingState /> : latest.length ? <Grid>{latest.map((a, i) => <NewsCard key={a.id} article={a} delay={i * 0.08} />)}</Grid> : <EmptyState title="No news yet" text="Announcements will be published here." />}
      </Section>

      <Section alt>
        <SectionHeading eyebrow="Learn with us" title="Formations & activities" action={more(routes.formations, "All formations")} />
        {fm.loading ? <LoadingState /> : forms.length ? <Grid>{forms.map((f, i) => <FormationCard key={f.id} formation={f} delay={i * 0.08} />)}</Grid> : <EmptyState title="No formations right now" text="Check back soon." />}
      </Section>

      <Section>
        <SectionHeading eyebrow="Partnerships" title="Conventions" action={more(routes.conventions, "All conventions")} />
        {conv ? <div className="max-w-md"><ConventionCard convention={conv} /></div> : <EmptyState title="No conventions listed" text="Partnerships will be listed here." />}
      </Section>

      <Section alt>
        <SectionHeading eyebrow="Gallery" title="Life at Lyceum Club" />
        <PinterestGallery />
      </Section>

      <section className="relative overflow-hidden border-t border-line py-24 text-center">
        <GridBackdrop />
        <Reveal className="container-x relative">
          <h2 className="font-display text-4xl font-semibold sm:text-5xl">Become part of Lyceum Club</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted">Create your member profile and follow what's happening in Batna.</p>
          <Button asChild size="lg" className="mt-8"><a href={routes.joinUs}>Join Us<ArrowRight className="h-4 w-4" aria-hidden /></a></Button>
        </Reveal>
      </section>
    </>
  );
}
