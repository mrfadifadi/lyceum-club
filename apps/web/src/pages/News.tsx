import { routes } from "@/lib/routes";
import { PageHeading, Section } from "@/components/shared/Headings";
import { NewsCard } from "@/components/shared/Cards";
import { EmptyState, ImagePlaceholder, LoadingState } from "@/components/shared/Placeholders";
import { Reveal } from "@/components/shared/Reveal";
import { useAsync } from "@/hooks/useAsync";
import { getNews } from "@/services/api";
import { formatDate } from "@/lib/utils";

export default function News() {
  const { data, loading } = useAsync(getNews);
  const sorted = [...(data ?? [])].sort((a, b) => b.date.localeCompare(a.date));
  const featured = sorted.find((a) => a.featured) ?? sorted[0];
  const rest = sorted.filter((a) => a !== featured);
  return (
    <>
      <PageHeading eyebrow="News" title="News & announcements" text="Updates from the club. Entries marked “Sample” are placeholders." />
      <Section>
        {loading ? <LoadingState /> : !featured ? <EmptyState title="Nothing published yet" text="News and announcements will appear here." /> : (<>
          <Reveal>
            <a href={routes.article(featured.slug)} className="group grid overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface transition-colors hover:border-fg/40 md:grid-cols-2">
              <div className="aspect-[16/10] md:aspect-auto">{featured.imageUrl ? <img src={featured.imageUrl} alt={featured.title} className="h-full w-full object-cover" /> : <ImagePlaceholder label={featured.title} />}</div>
              <div className="flex flex-col justify-center gap-4 p-8 md:p-12">
                <p className="text-xs uppercase tracking-[0.2em] text-fg">Featured · {featured.category}{featured.isSample && " · Sample"}</p>
                <h2 className="font-display text-3xl font-semibold group-hover:text-fg sm:text-4xl">{featured.title}</h2>
                <p className="text-muted">{featured.excerpt}</p><p className="text-sm text-muted">{formatDate(featured.date)}</p>
              </div>
            </a>
          </Reveal>
          {rest.length > 0 && <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{rest.map((a, i) => <NewsCard key={a.id} article={a} delay={i * 0.06} />)}</div>}
        </>)}
      </Section>
    </>
  );
}
