/** One real HTML file per page. Detail templates take a ?slug= query parameter. */
const q = (s: string) => encodeURIComponent(s);
export const routes = {
  home: "/", events: "/events.html", news: "/news.html", about: "/about.html",
  formations: "/formations.html", conventions: "/conventions.html", joinUs: "/join-us.html",
  admin: "/admin.html",
  member: "/member.html",
  event: (slug: string) => `/event.html?slug=${q(slug)}`,
  article: (slug: string) => `/article.html?slug=${q(slug)}`,
  convention: (slug: string) => `/convention.html?slug=${q(slug)}`,
};
export const getSlug = () => new URLSearchParams(window.location.search).get("slug") ?? "";
export const currentFile = () => window.location.pathname.split("/").pop() || "index.html";
