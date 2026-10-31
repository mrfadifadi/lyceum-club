import { Loader2, Inbox } from "lucide-react";
import { Logo } from "./Logo";

/** Generated (no network) stand-in for images. Replace by passing `imageUrl` on the content item. */
export function ImagePlaceholder({ label }: { label: string }) {
  return (
    <div role="img" aria-label={`Placeholder image: ${label}`} className="relative grid h-full w-full place-items-center overflow-hidden bg-surface-2 [background:radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_55%),var(--color-surface-2)]">
      <Logo className="h-1/3 opacity-20" />
    </div>
  );
}
export const LoadingState = () => (
  <div role="status" className="grid place-items-center gap-3 py-24 text-muted"><Loader2 className="h-6 w-6 animate-spin" /><span className="text-sm">Loading…</span></div>
);
export const EmptyState = ({ title, text }: { title: string; text: string }) => (
  <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-line px-6 py-14 text-center">
    <Inbox className="h-7 w-7 text-muted" aria-hidden /><p className="font-medium">{title}</p><p className="max-w-sm text-sm text-muted">{text}</p>
  </div>
);
