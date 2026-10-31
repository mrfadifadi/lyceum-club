import fs from "node:fs";
import path from "node:path";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentType } from "react";
import { Layout } from "@/components/layout/Layout";
import { navLinks } from "@/components/layout/Navbar";
import { RandomLetterSwap } from "@/components/ui/random-letter-swap";
import Home from "@/pages/Home"; import Events from "@/pages/Events"; import News from "@/pages/News"; import About from "@/pages/About";
import Formations from "@/pages/Formations"; import Conventions from "@/pages/Conventions"; import JoinUs from "@/pages/JoinUs";
import { EventDetail, ArticleDetail, ConventionDetail } from "@/pages/Details";
import { validateLogin, validateStep1, validateStep2, validateStep3, validateCv, countWords } from "@/lib/validation";

const root = path.resolve(__dirname, "../..");
const pages: [string, ComponentType, boolean][] = [
  ["/", Home, true], ["/events.html", Events, true], ["/news.html", News, true], ["/about.html", About, true],
  ["/formations.html", Formations, true], ["/conventions.html", Conventions, true], ["/join-us.html", JoinUs, false],
  ["/event.html?slug=sample-event-1", EventDetail, true], ["/article.html?slug=sample-announcement-1", ArticleDetail, true],
  ["/convention.html?slug=sample-convention-1", ConventionDetail, true],
];
const show = (url: string, C: ComponentType, layout: boolean) => {
  window.history.pushState({}, "", url);
  return render(layout ? <Layout><C /></Layout> : <C />);
};
const fileOf = (href: string) => { const f = href.split(/[?#]/)[0]; return f === "/" ? "index.html" : f.slice(1); };

describe("separate HTML pages", () => {
  it("every page has its own html file with an existing entry script", () => {
    for (const f of ["index", "events", "news", "about", "formations", "conventions", "join-us", "event", "article", "convention"]) {
      const html = fs.readFileSync(path.join(root, `${f}.html`), "utf8");
      expect(html).toContain("<title>");
      const entry = html.match(/src="\/(src\/entries\/[\w-]+\.tsx)"/)![1];
      expect(fs.existsSync(path.join(root, entry))).toBe(true);
    }
  });
  it.each(pages)("renders %s and all its internal links point to real html files", async (url, C, layout) => {
    show(url, C, layout);
    await waitFor(() => expect(document.body.textContent!.length).toBeGreaterThan(80));
    expect(screen.queryByText("Not found")).toBeNull();
    for (const a of document.querySelectorAll<HTMLAnchorElement>("a[href^='/']")) {
      expect(fs.existsSync(path.join(root, fileOf(a.getAttribute("href")!))), a.getAttribute("href")!).toBe(true);
    }
    cleanup();
  });
  it("navbar has the 6 links + Join Us and marks the current page", () => {
    show("/events.html", Events, true);
    for (const l of navLinks) expect(document.querySelector(`header a[href="${l.to}"]`)).not.toBeNull();
    expect(document.querySelector('header a[href="/join-us.html"]')).not.toBeNull();
    expect(document.querySelector('header nav a[aria-current="page"]')).toHaveAttribute("href", "/events.html");
  });
  it("unknown slug shows a not-found state", async () => {
    show("/event.html?slug=nope", EventDetail, true);
    expect(await screen.findByText("Not found")).toBeInTheDocument();
  });
});

describe("design tokens", () => {
  it("no component uses a colour class that doesn't exist (those render as invisible text)", () => {
    const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
    const css = fs.readFileSync(path.join(root, "src/index.css"), "utf8");
    const tokens = new Set([...css.matchAll(/--color-([\w-]+):/g)].map((m) => m[1]));
    for (const f of walk(path.join(root, "src")).filter((f) => f.endsWith(".tsx") && !f.includes("test"))) {
      for (const m of fs.readFileSync(f, "utf8").matchAll(/\b(?:text|bg|border|ring)-(fg|bg|brand|line|muted|surface|danger|ok)(-[a-z0-9]+)?\b/g)) {
        const name = m[1] + (m[2] ?? "");
        expect(tokens.has(name), `${path.basename(f)}: ${m[0]}`).toBe(true);
      }
    }
  });
});

describe("letter swap", () => {
  it("always spells the real label (first and last letter of every stack are the real letter)", () => {
    const { container } = render(<RandomLetterSwap label="About Us" />);
    expect(container.querySelector(".sr-only")!.textContent).toBe("About Us");
    const real = [...container.querySelectorAll(".lswap-stack")].map((s) => s.children[0].textContent! + "|" + s.children[2].textContent!);
    expect(real.map((r) => r.split("|")[0]).join("")).toBe("AboutUs");
    expect(real.every((r) => r.split("|")[0] === r.split("|")[1])).toBe(true);
  });
});

describe("validation + join form", () => {
  it("validates login", () => { expect(Object.keys(validateLogin({ email: "x", password: "" }))).toEqual(["email", "password"]); expect(validateLogin({ email: "a@b.co", password: "x" })).toEqual({}); });
  it("validates step 1", () => {
    expect(Object.keys(validateStep1({ firstName: "A", lastName: "", email: "x", phone: "12", password: "short", confirm: "other" })).sort()).toEqual(["confirm", "email", "firstName", "lastName", "password", "phone"]);
    expect(validateStep1({ firstName: "Ada", lastName: "Lovelace", email: "a@b.co", phone: "+213 555 12 34 56", password: "longenough", confirm: "longenough" })).toEqual({});
  });
  it("validates step 2 (system decides what is required)", () => {
    expect(Object.keys(validateStep2({ university: "", major: "", system: "", level: "", status: "", year: "" })).sort()).toEqual(["major", "system", "university"]);
    expect(Object.keys(validateStep2({ university: "Univ", major: "Chem", system: "lmd", level: "", status: "", year: "" })).sort()).toEqual(["level", "status"]);
    expect(validateStep2({ university: "Univ", major: "Chem", system: "lmd", level: "master", status: "studying", year: "" }).year).toBeTruthy();
    expect(validateStep2({ university: "Univ", major: "Chem", system: "lmd", level: "master", status: "studying", year: "2nd year" })).toEqual({});
    expect(validateStep2({ university: "Univ", major: "Chem", system: "lmd", level: "licence", status: "graduated", year: "" })).toEqual({});
    expect(validateStep2({ university: "Univ", major: "Chem", system: "engineer", level: "", status: "", year: "" }).year).toBeTruthy();
    expect(validateStep2({ university: "Univ", major: "Chem", system: "classical", level: "", status: "", year: "7th year" })).toEqual({});
  });
  it("validates step 3: 50 words minimum + CV type/size", () => {
    expect(countWords("one two  three\nfour")).toBe(4);
    expect(validateStep3({ motivation: "word ".repeat(49), cv: null }).motivation).toMatch(/at least 50 words/);
    expect(validateStep3({ motivation: "word ".repeat(50), cv: null })).toEqual({});
    expect(validateCv(new File(["x"], "cv.exe"))).toBeTruthy();
    expect(validateCv(new File(["x"], "cv.PDF"))).toBeUndefined();
    expect(validateCv(new File(["x"], "cv.docx"))).toBeUndefined();
    expect(validateCv(new File([new Uint8Array(6 * 1024 * 1024)], "big.pdf"))).toMatch(/too large/);
  });
  it("shows inline errors and the honest preview note", async () => {
    const u = userEvent.setup(); show("/join-us.html", JoinUs, false);
    await u.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByText("Enter your email address.")).toBeInTheDocument();
    await u.type(document.querySelector("#login-email")!, "a@b.co");
    await u.type(document.querySelector("#login-password")!, "secret123");
    await u.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByText(/nothing was sent/)).toBeInTheDocument();
  });
  it("toggles password visibility", async () => {
    const u = userEvent.setup(); show("/join-us.html", JoinUs, false);
    const input = document.querySelector("#login-password") as HTMLInputElement;
    expect(input.type).toBe("password");
    await u.click(screen.getAllByRole("button", { name: "Show password" })[0]);
    expect(input.type).toBe("text");
  });
  it("sign-up wizard: 3 steps, per-step validation, year options follow the system, data kept on Back", async () => {
    const u = userEvent.setup(); show("/join-us.html", JoinUs, false);
    await u.click(screen.getByRole("tab", { name: "Sign Up" }));
    const type = (id: string, value: string) => fireEvent.change(document.querySelector(id)!, { target: { value } });
    const stepper = () => document.querySelector('[aria-label="Sign up progress"] [aria-current="step"]')!.textContent;

    // step 1
    expect(stepper()).toContain("1");
    await u.click(screen.getByRole("button", { name: /^Next/ }));
    expect(await screen.findByText("Enter your first name.")).toBeInTheDocument();
    type("#su-firstName", "Ada"); type("#su-lastName", "Lovelace"); type("#su-email", "ada@example.com"); type("#su-phone", "+213 555 12 34 56");
    type("#su-password", "longenough"); type("#su-confirm", "longenough");
    await u.click(screen.getByRole("button", { name: /^Next/ }));

    // step 2
    expect(await screen.findByText(/Step 2 of 3/)).toBeInTheDocument();
    expect(stepper()).toContain("2");
    expect((document.querySelector("#su-year") as HTMLSelectElement).disabled).toBe(true);
    await u.click(screen.getByRole("button", { name: /^Next/ }));
    expect(await screen.findByText("Choose your academic system.")).toBeInTheDocument();
    const opts = (sel: string) => [...document.querySelectorAll(`${sel} option`)].map((o) => o.textContent).filter((t) => t && !/Select|first/.test(t));
    expect(screen.queryByText("Medicine system")).toBeNull();
    await u.click(screen.getByLabelText(/Engineer system/)); expect(opts("#su-year")).toEqual(["1st year", "2nd year", "3rd year", "4th year", "5th year"]);
    expect(document.querySelector("#su-level")).toBeNull();
    await u.click(screen.getByLabelText(/Classical system/)); expect(opts("#su-year")).toHaveLength(7); expect(opts("#su-year")[6]).toBe("7th year");
    await u.click(screen.getByLabelText(/LMD system/));
    expect(opts("#su-level")).toEqual(["Licence", "Master", "Doctorat"]);
    await u.click(screen.getByRole("button", { name: /^Next/ }));
    expect(await screen.findByText("Choose Licence, Master or Doctorat.")).toBeInTheDocument();
    expect(screen.getByText("Tell us whether you are studying or have graduated.")).toBeInTheDocument();
    await u.click(screen.getByLabelText("Currently studying"));
    await u.selectOptions(document.querySelector("#su-level")!, "licence"); expect(opts("#su-year")).toEqual(["1st year", "2nd year", "3rd year"]);
    await u.selectOptions(document.querySelector("#su-level")!, "master"); expect(opts("#su-year")).toEqual(["1st year", "2nd year"]);
    await u.selectOptions(document.querySelector("#su-level")!, "doctorat"); expect(opts("#su-year")).toEqual(["1st year", "2nd year", "3rd year", "Extension (beyond 3rd year)"]);
    await u.click(screen.getByLabelText("Graduated")); expect(document.querySelector("#su-year")).toBeNull(); // graduates need no current year
    await u.click(screen.getByLabelText("Currently studying")); expect(document.querySelector("#su-year")).not.toBeNull();
    await u.selectOptions(document.querySelector("#su-level")!, "master");
    type("#su-university", "University of Batna 1"); type("#su-major", "Physical Chemistry");
    await u.selectOptions(document.querySelector("#su-year")!, "2nd year");
    await u.click(screen.getByRole("button", { name: "Back" }));
    expect((document.querySelector("#su-email") as HTMLInputElement).value).toBe("ada@example.com"); // data kept
    await u.click(screen.getByRole("button", { name: /^Next/ }));
    expect((document.querySelector("#su-university") as HTMLInputElement).value).toBe("University of Batna 1");
    await u.click(screen.getByRole("button", { name: /^Next/ }));

    // step 3
    expect(await screen.findByText(/Step 3 of 3/)).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText(/at least 50 words \(you have 0\)/)).toBeInTheDocument();
    type("#su-motivation", "word ".repeat(50));
    fireEvent.change(document.querySelector("#su-cv")!, { target: { files: [new File(["x"], "cv.exe")] } });
    await u.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("Upload a PDF, DOC or DOCX file.")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Remove file" }));
    await u.type(document.querySelector("#su-languages")!, "Python,TypeScript{Enter}");
    expect(screen.getByRole("button", { name: "Remove Python" })).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText(/nothing was sent/)).toBeInTheDocument();
  });
});
