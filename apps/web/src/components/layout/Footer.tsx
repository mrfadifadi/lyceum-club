import { routes } from "@/lib/routes";
import { Mail, Phone, MapPin } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { navLinks } from "./Navbar";
import { club } from "@/data/club";

export function Footer() {
  const { contact, socials } = club;
  const hasContact = contact.email || contact.phone || contact.address;
  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.2fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo variant="full" className="h-24" />
          <p className="max-w-xs text-sm text-muted">{club.name} — {club.city}</p>
        </div>
        <nav aria-label="Footer"><h2 className="mb-4 text-sm font-medium">Explore</h2>
          <ul className="space-y-2.5 text-sm text-muted">
            {[...navLinks.slice(1), { label: "Join Us", to: routes.joinUs }].map((l) => <li key={l.to}><a className="hover:text-fg" href={l.to}>{l.label}</a></li>)}
          </ul>
        </nav>
        <div><h2 className="mb-4 text-sm font-medium">Contact</h2>
          {hasContact ? (
            <ul className="space-y-2.5 text-sm text-muted">
              {contact.email && <li className="flex gap-2"><Mail className="h-4 w-4" aria-hidden /><a className="hover:text-fg" href={`mailto:${contact.email}`}>{contact.email}</a></li>}
              {contact.phone && <li className="flex gap-2"><Phone className="h-4 w-4" aria-hidden />{contact.phone}</li>}
              {contact.address && <li className="flex gap-2"><MapPin className="h-4 w-4" aria-hidden />{contact.address}</li>}
            </ul>
          ) : <p className="text-sm text-muted">Contact details coming soon.</p>}
          {socials.length > 0 && <ul className="mt-4 flex gap-4 text-sm">{socials.map((s) => <li key={s.href}><a className="text-fg hover:underline" href={s.href} target="_blank" rel="noreferrer">{s.label}</a></li>)}</ul>}
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-muted">© {new Date().getFullYear()} {club.name} Batna</div>
    </footer>
  );
}
