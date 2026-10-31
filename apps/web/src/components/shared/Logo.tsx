import { routes } from "@/lib/routes";

export function Logo({ variant = "shield", className = "h-10" }: { variant?: "shield" | "full"; className?: string }) {
  const src = variant === "full" ? "/logo-full.png" : "/logo-shield.png";
  return <img src={src} alt="Lyceum Club logo" className={`w-auto ${className}`} />;
}
export const LogoLink = () => (
  <a href={routes.home} aria-label="Lyceum Club — home" className="flex items-center gap-3">
    <Logo className="h-10" />
    <span className="font-display text-lg font-semibold tracking-wide max-sm:sr-only">Lyceum <span className="text-zinc-400">Batna</span></span>
  </a>
);
