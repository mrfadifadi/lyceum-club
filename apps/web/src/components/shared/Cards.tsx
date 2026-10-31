import { routes } from "@/lib/routes";
import { CalendarDays, MapPin, Clock, ArrowUpRight, ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { formatDate } from "@/lib/utils";
import { ImagePlaceholder } from "./Placeholders";
import { Reveal } from "./Reveal";
import { Button } from "@/components/ui/button";
import type { ClubEvent, Convention, Formation, NewsArticle } from "@/types/content";

type Item = { title: string; category: string; imageUrl?: string; imageAlt?: string; isSample?: boolean };

function CardShell({ item, to, children, delay = 0 }: { item: Item; to?: string; children: ReactNode; delay?: number }) {
  const body = (
    <article className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-fg/40">
      <div className="relative aspect-[16/10] overflow-hidden">
        {item.imageUrl ? <img src={item.imageUrl} alt={item.imageAlt ?? item.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <ImagePlaceholder label={item.title} />}
        <span className="absolute left-3 top-3 rounded-full bg-bg/80 px-3 py-1 text-xs backdrop-blur">{item.category}</span>
        {item.isSample && <span className="absolute right-3 top-3 rounded-full bg-fg px-3 py-1 text-xs font-medium text-bg">Sample</span>}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">{children}</div>
    </article>
  );
  return <Reveal delay={delay} className="h-full">{to ? <a href={to} className="block h-full rounded-[var(--radius-card)]">{body}</a> : body}</Reveal>;
}
const Meta = ({ icon: I, children }: { icon: typeof Clock; children: ReactNode }) => <span className="inline-flex items-center gap-1.5 text-xs text-muted"><I className="h-3.5 w-3.5" aria-hidden />{children}</span>;
const Title = ({ children }: { children: ReactNode }) => <h3 className="font-display text-xl font-semibold leading-snug">{children}</h3>;

export const EventCard = ({ event, delay }: { event: ClubEvent; delay?: number }) => (
  <CardShell item={event} to={routes.event(event.slug)} delay={delay}>
    <div className="flex flex-wrap gap-4"><Meta icon={CalendarDays}>{formatDate(event.date)}</Meta><Meta icon={MapPin}>{event.location}</Meta></div>
    <Title>{event.title}</Title><p className="text-sm text-muted">{event.excerpt}</p>
    <span className="mt-auto inline-flex items-center gap-1 text-sm text-fg">Details <ArrowUpRight className="h-4 w-4" aria-hidden /></span>
  </CardShell>
);
export const NewsCard = ({ article, delay }: { article: NewsArticle; delay?: number }) => (
  <CardShell item={article} to={routes.article(article.slug)} delay={delay}>
    <Meta icon={CalendarDays}>{formatDate(article.date)}</Meta><Title>{article.title}</Title><p className="text-sm text-muted">{article.excerpt}</p>
    <span className="mt-auto inline-flex items-center gap-1 text-sm text-fg">Read <ArrowUpRight className="h-4 w-4" aria-hidden /></span>
  </CardShell>
);
export const ConventionCard = ({ convention, delay }: { convention: Convention; delay?: number }) => (
  <CardShell item={convention} to={routes.convention(convention.slug)} delay={delay}>
    <div className="flex flex-wrap gap-4"><Meta icon={CalendarDays}>{formatDate(convention.date)}</Meta><Meta icon={MapPin}>{convention.location}</Meta></div>
    <Title>{convention.title}</Title><p className="text-sm text-muted">{convention.excerpt}</p>
    {convention.partner && <p className="text-xs text-muted">With: {convention.partner}</p>}
    <span className="mt-auto inline-flex items-center gap-1 text-sm text-fg">Details <ArrowUpRight className="h-4 w-4" aria-hidden /></span>
  </CardShell>
);
const statusLabel = { open: "Open", upcoming: "Upcoming", past: "Past" } as const;
export function FormationCard({ formation, delay }: { formation: Formation; delay?: number }) {
  const [open, setOpen] = useState(false);
  const id = `formation-${formation.id}`;
  return (
    <CardShell item={formation} delay={delay}>
      <div className="flex flex-wrap gap-4"><Meta icon={Clock}>{formation.duration}</Meta><span className="text-xs text-fg">{statusLabel[formation.status]}</span></div>
      <Title>{formation.title}</Title><p className="text-sm text-muted">{formation.excerpt}</p>
      <div id={id} hidden={!open} className="space-y-2 text-sm text-muted">{formation.body.map((p, i) => <p key={i}>{p}</p>)}</div>
      <Button variant="outline" size="sm" className="mt-auto self-start" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
        {open ? "Hide details" : "View details"}<ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </Button>
    </CardShell>
  );
}
