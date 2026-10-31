import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useEffect } from "react";
import { ImagePlaceholder, LoadingState, EmptyState } from "./Placeholders";
import { GridBackdrop } from "./GridBackdrop";

interface Props { backTo: string; backLabel: string; loading: boolean; item?: { title: string; category: string; body: string[]; date?: string; location?: string; imageUrl?: string; isSample?: boolean } }

/** Shared template for event / article / convention detail pages. */
export function DetailLayout({ backTo, backLabel, loading, item }: Props) {
  useEffect(() => { if (item) document.title = `${item.title} · Lyceum Club Batna`; }, [item]);
  if (loading) return <div className="pt-32"><LoadingState /></div>;
  if (!item) return <div className="container-x pt-40 pb-24"><EmptyState title="Not found" text="This page doesn't exist (or isn't published yet)." /><a className="mt-6 inline-block text-zinc-400" href={backTo}>← {backLabel}</a></div>;
  return (
    <article>
      <header className="relative overflow-hidden border-b border-line pb-14 pt-36"><GridBackdrop />
        <div className="container-x relative max-w-3xl">
          <a href={backTo} className="inline-flex items-center gap-2 text-sm text-muted hover:text-fg"><ArrowLeft className="h-4 w-4" aria-hidden />{backLabel}</a>
          <p className="mt-6 text-xs uppercase tracking-[0.2em] text-zinc-400">{item.category}{item.isSample && " · Sample content"}</p>
          <h1 className="font-display mt-3 text-4xl font-semibold sm:text-5xl">{item.title}</h1>
          <div className="mt-5 flex flex-wrap gap-5 text-sm text-muted">
            {item.date && <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" aria-hidden />{formatDate(item.date)}</span>}
            {item.location && <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" aria-hidden />{item.location}</span>}
          </div>
        </div>
      </header>
      <div className="container-x max-w-3xl py-14">
        <div className="mb-10 aspect-[16/8] overflow-hidden rounded-[var(--radius-card)] border border-line">
          {item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" /> : <ImagePlaceholder label={item.title} />}
        </div>
        <div className="space-y-5 text-lg leading-relaxed text-zinc-300">{item.body.map((p, i) => <p key={i}>{p}</p>)}</div>
      </div>
    </article>
  );
}
