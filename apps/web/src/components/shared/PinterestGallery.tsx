import { useState } from "react";
import { Play, X } from "lucide-react";
import { Reveal } from "./Reveal";

export interface MediaItem {
  id: string;
  type: "image" | "video";
  /** For images: the src URL. For videos: the embed URL (YouTube/etc.) or direct video URL. */
  src: string;
  /** Thumbnail image shown in the grid for both images and videos. */
  thumbnail: string;
  alt: string;
  /** Display title shown on hover */
  title?: string;
  /** Approximate visual height class to create a masonry feel */
  tall?: boolean;
}

/** Sample placeholder items — replace with real content from the API or CMS. */
const SAMPLE_ITEMS: MediaItem[] = [
  { id: "1", type: "image", src: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600", thumbnail: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600", alt: "Students collaborating at Lyceum Club", title: "Club Sessions", tall: true },
  { id: "2", type: "image", src: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600", thumbnail: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600", alt: "Event at the university", title: "Events" },
  { id: "3", type: "image", src: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600", thumbnail: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600", alt: "Group of students", title: "Our Community", tall: true },
  { id: "4", type: "video", src: "https://www.youtube.com/embed/dQw4w9WgXcQ", thumbnail: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600", alt: "Club intro video", title: "About Lyceum" },
  { id: "5", type: "image", src: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=600", thumbnail: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=600", alt: "Lecture and learning", title: "Learning Together" },
  { id: "6", type: "image", src: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600", thumbnail: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600", alt: "Workshop activity", title: "Workshops", tall: true },
  { id: "7", type: "video", src: "https://www.youtube.com/embed/dQw4w9WgXcQ", thumbnail: "https://images.unsplash.com/photo-1559223607-b4d0555ae227?w=600", alt: "Formation video", title: "Formations" },
  { id: "8", type: "image", src: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600", thumbnail: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600", alt: "Conference and presentations", title: "Conferences" },
  { id: "9", type: "image", src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600", thumbnail: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600", alt: "Teamwork", title: "Teamwork", tall: true },
];

function LightboxModal({ item, onClose }: { item: MediaItem; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.alt}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        aria-label="Close"
        onClick={onClose}
      >
        <X className="h-5 w-5" />
      </button>
      <div
        className="relative mx-4 max-h-[90vh] max-w-4xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {item.type === "image" ? (
          <img
            src={item.src}
            alt={item.alt}
            className="max-h-[90vh] w-full rounded-xl object-contain shadow-2xl"
          />
        ) : (
          <div className="aspect-video w-full overflow-hidden rounded-xl shadow-2xl">
            <iframe
              src={item.src}
              title={item.alt}
              className="h-full w-full"
              allowFullScreen
              allow="autoplay; fullscreen"
            />
          </div>
        )}
        {item.title && (
          <p className="mt-3 text-center text-sm text-white/80">{item.title}</p>
        )}
      </div>
    </div>
  );
}

export function PinterestGallery({ items = SAMPLE_ITEMS }: { items?: MediaItem[] }) {
  const [active, setActive] = useState<MediaItem | null>(null);

  return (
    <>
      {/* Masonry-style grid using CSS columns */}
      <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [column-fill:balance]">
        {items.map((item, i) => (
          <Reveal key={item.id} delay={i * 0.04} className="mb-3 break-inside-avoid">
            <button
              type="button"
              className="group relative w-full overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:border-fg/40 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
              aria-label={`Open ${item.type}: ${item.alt}`}
              onClick={() => setActive(item)}
            >
              <img
                src={item.thumbnail}
                alt={item.alt}
                loading="lazy"
                className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${item.tall ? "aspect-[2/3]" : "aspect-[4/3]"}`}
              />
              {/* Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/0 transition-colors duration-300 group-hover:bg-black/50 group-focus-visible:bg-black/50">
                {item.type === "video" && (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white opacity-80 transition-opacity group-hover:opacity-100 backdrop-blur-sm">
                    <Play className="h-5 w-5 translate-x-0.5" aria-hidden />
                  </span>
                )}
                {item.title && (
                  <span className="translate-y-2 px-3 text-center text-xs font-medium text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    {item.title}
                  </span>
                )}
              </div>
            </button>
          </Reveal>
        ))}
      </div>

      {active && <LightboxModal item={active} onClose={() => setActive(null)} />}
    </>
  );
}

