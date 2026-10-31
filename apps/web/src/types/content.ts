/** Shapes mirror the future API responses (snake_case → camelCase mapping happens in services/api.ts). */
interface Base {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string[];            // paragraphs
  category: string;
  imageUrl?: string;         // local /public path or API URL; falls back to a generated placeholder
  imageAlt?: string;
  isSample?: boolean;        // true = placeholder content, shown with a "Sample" badge
}
export interface ClubEvent extends Base { date: string; location: string; }
export interface NewsArticle extends Base { date: string; author?: string; featured?: boolean; }
export interface Formation extends Base { duration: string; status: "open" | "upcoming" | "past"; level?: string; }
export interface Convention extends Base { date: string; location: string; partner?: string; }
