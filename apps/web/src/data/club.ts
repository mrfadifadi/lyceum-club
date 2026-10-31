/** Club-level info. Only fields marked REAL come from the brief; everything else is editable placeholder. */
export const club = {
  name: "Lyceum Club",            // REAL
  city: "Batna, Algeria",         // REAL
  tagline: "A student club in Batna.",                                   // PLACEHOLDER
  intro: "Lyceum Club brings students together in Batna to learn, meet and build things as a community.", // PLACEHOLDER — replace with official text
  mission: "Placeholder: write the club's official mission here.",
  vision: "Placeholder: write the club's official vision here.",
  values: [
    { title: "Learning", text: "Placeholder value — replace with the club's real values." },
    { title: "Community", text: "Placeholder value — replace with the club's real values." },
    { title: "Initiative", text: "Placeholder value — replace with the club's real values." },
  ],
  activities: ["Events", "Formations (workshops)", "Conventions", "News & announcements"],
  contact: { email: "", phone: "", address: "" },     // fill in; footer hides empty fields
  socials: [] as { label: string; href: string }[],  // e.g. { label: "Instagram", href: "https://…" }
  team: [] as { name: string; role: string }[],      // leave empty until the real team is confirmed
};
