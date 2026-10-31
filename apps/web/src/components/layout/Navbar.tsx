import { useEffect, useState } from "react";
import { ArrowRight, Menu, ShieldCheck, X } from "lucide-react";
import { RandomLetterSwap } from "@/components/ui/random-letter-swap";
import { Button } from "@/components/ui/button";
import { LogoLink } from "@/components/shared/Logo";
import { cn } from "@/lib/utils";
import { currentFile, routes } from "@/lib/routes";
import { getAuthUser } from "@/lib/auth";

/** `match` lists the files that count as "this section" (detail pages keep their parent highlighted). */
export const navLinks = [
  { label: "Home", to: routes.home, match: ["index.html"] },
  { label: "Events", to: routes.events, match: ["events.html", "event.html"] },
  { label: "News", to: routes.news, match: ["news.html", "article.html"] },
  { label: "About Us", to: routes.about, match: ["about.html"] },
  { label: "Formations", to: routes.formations, match: ["formations.html"] },
  { label: "Conventions", to: routes.conventions, match: ["conventions.html", "convention.html"] },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const file = currentFile();

  useEffect(() => {
    const user = getAuthUser();
    setIsAdmin(user?.role === "admin");
    const on = () => setScrolled(window.scrollY > 24);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 transition-all duration-300", scrolled || open ? "border-b border-line bg-bg/85 backdrop-blur-md" : "border-b border-transparent")}>
      {/* 3 equal-weight columns: logo hard-left, links truly centred, Join Us hard-right */}
      <div className="grid h-[72px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 sm:px-8 lg:px-10">
        <div className="col-start-1 justify-self-start"><LogoLink /></div>

        <nav aria-label="Main" className="col-start-2 hidden lg:block">
          <ul className="flex items-center gap-1">
            {navLinks.map((l) => {
              const active = l.match.includes(file);
              return (
                <li key={l.to}>
                  <a href={l.to} aria-current={active ? "page" : undefined}
                    className={cn("lswap-host relative block px-3.5 py-3 text-sm font-medium transition-colors", active ? "text-fg" : "text-muted hover:text-fg focus-visible:text-fg")}>
                    <RandomLetterSwap label={l.label} />
                    <span aria-hidden className={cn("absolute inset-x-3.5 bottom-1.5 h-px origin-left bg-fg transition-transform duration-300", active ? "scale-x-100" : "scale-x-0")} />
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="col-start-3 flex items-center gap-2 justify-self-end">
          {isAdmin && (
            <Button asChild variant="outline" size="sm" className="border-fg/40 text-fg">
              <a href={routes.admin}><ShieldCheck className="h-4 w-4 mr-1.5" />Admin</a>
            </Button>
          )}
          <Button asChild className="max-sm:hidden">
            <a href={routes.joinUs}>Join Us<ArrowRight className="h-4 w-0 -translate-x-2 opacity-0 transition-all duration-300 group-hover:w-4 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:w-4 group-focus-visible:translate-x-0 group-focus-visible:opacity-100" aria-hidden /></a>
          </Button>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((v) => !v)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <nav id="mobile-menu" aria-label="Mobile" hidden={!open} className="max-h-[calc(100dvh-72px)] overflow-y-auto border-t border-line bg-bg lg:hidden">
        <ul className="flex flex-col px-5 py-4 sm:px-8">
          {isAdmin && (
            <li><a href={routes.admin} className="flex items-center gap-2 border-b border-line/60 py-4 text-lg text-fg font-semibold"><ShieldCheck className="h-5 w-5" />Admin Dashboard</a></li>
          )}
          {navLinks.map((l) => (
            <li key={l.to}><a href={l.to} aria-current={l.match.includes(file) ? "page" : undefined} className={cn("block border-b border-line/60 py-4 text-lg", l.match.includes(file) ? "text-fg" : "text-muted")}>{l.label}</a></li>
          ))}
          <li className="pt-5"><Button asChild className="w-full" size="lg"><a href={routes.joinUs}>Join Us</a></Button></li>
        </ul>
      </nav>
    </header>
  );
}
