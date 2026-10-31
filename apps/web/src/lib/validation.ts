export type Errors = Record<string, string>;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const MIN_WORDS = 50;
export const MAX_CV_MB = 5;
export const CV_EXTENSIONS = [".pdf", ".doc", ".docx"];

export const countWords = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

const emailError = (email: string) =>
  !email.trim() ? "Enter your email address." : !EMAIL.test(email.trim()) ? "Enter a valid email address." : undefined;

export function validateLogin(v: { email: string; password: string }): Errors {
  const e: Errors = {};
  const m = emailError(v.email); if (m) e.email = m;
  if (!v.password) e.password = "Enter your password.";
  return e;
}

export interface SignupValues {
  firstName: string; lastName: string; email: string; phone: string; password: string; confirm: string;
  university: string; major: string; system: string; level: string; status: string; year: string;
  motivation: string; technical: string[]; languages: string[]; interests: string[]; cv: File | null;
}

/** Step 1 — personal information */
export function validateStep1(v: Pick<SignupValues, "firstName" | "lastName" | "email" | "phone" | "password" | "confirm">): Errors {
  const e: Errors = {};
  if (v.firstName.trim().length < 2) e.firstName = "Enter your first name.";
  if (v.lastName.trim().length < 2) e.lastName = "Enter your last name.";
  const m = emailError(v.email); if (m) e.email = m;
  const digits = v.phone.replace(/\D/g, "").length;
  if (!v.phone.trim()) e.phone = "Enter your phone number.";
  else if (!/^\+?[0-9 ().-]+$/.test(v.phone.trim()) || digits < 8 || digits > 15) e.phone = "Enter a valid phone number.";
  if (v.password.length < 8) e.password = "Use at least 8 characters.";
  if (!v.confirm) e.confirm = "Enter your password again.";
  else if (v.confirm !== v.password) e.confirm = "Passwords don't match.";
  return e;
}

/** Step 2 — academic information */
export function validateStep2(v: Pick<SignupValues, "university" | "major" | "system" | "level" | "status" | "year">): Errors {
  const e: Errors = {};
  if (v.university.trim().length < 2) e.university = "Enter your university.";
  if (v.major.trim().length < 2) e.major = "Enter your major or field of study.";
  if (!v.system) { e.system = "Choose your academic system."; return e; }
  if (v.system === "lmd") {
    if (!v.level) e.level = "Choose Licence, Master or Doctorat.";
    if (!v.status) e.status = "Tell us whether you are studying or have graduated.";
    // a graduate has finished the level, so no current year is needed
    if (v.status === "studying" && v.level && !v.year) e.year = "Choose your year.";
  } else if (!v.year) e.year = "Choose your academic year.";
  return e;
}

export function validateCv(file: File | null): string | undefined {
  if (!file) return undefined;
  const ext = file.name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0];
  if (!ext || !CV_EXTENSIONS.includes(ext)) return "Upload a PDF, DOC or DOCX file.";
  if (file.size === 0) return "This file is empty.";
  if (file.size > MAX_CV_MB * 1024 * 1024) return `This file is too large (maximum ${MAX_CV_MB} MB).`;
  return undefined;
}

/** Step 3 — tell us about yourself (skills and CV are optional) */
export function validateStep3(v: Pick<SignupValues, "motivation" | "cv">): Errors {
  const e: Errors = {};
  const words = countWords(v.motivation);
  if (words < MIN_WORDS) e.motivation = `Write at least ${MIN_WORDS} words (you have ${words}).`;
  const cv = validateCv(v.cv); if (cv) e.cv = cv;
  return e;
}
