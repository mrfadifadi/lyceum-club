/** Content data defaults to local fixtures; set VITE_USE_MOCK_DATA=false to use the PHP API. */
import { events } from "@/data/events";
import { news } from "@/data/news";
import { formations } from "@/data/formations";
import { conventions } from "@/data/conventions";
import type { ClubEvent, Convention, Formation, NewsArticle } from "@/types/content";
import type { LoginResult } from "@/lib/auth";

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "/api/v1";
const USE_MOCK = (import.meta.env.VITE_USE_MOCK_DATA ?? "true") !== "false";

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status} on ${path}`);
  return res.json() as Promise<T>;
}
const list = <T,>(mock: T[], path: string): Promise<T[]> => (USE_MOCK ? Promise.resolve(mock) : request<T[]>(path));
const one = <T extends { slug: string }>(mock: T[], path: string, slug: string): Promise<T | undefined> =>
  USE_MOCK ? Promise.resolve(mock.find((i) => i.slug === slug)) : request<T>(`${path}/${slug}`);

export const getEvents = () => list<ClubEvent>(events, "/events");
export const getEvent = (slug: string) => one(events, "/events", slug);
export const getNews = () => list<NewsArticle>(news, "/news");
export const getArticle = (slug: string) => one(news, "/news", slug);
export const getFormations = () => list<Formation>(formations, "/formations");
export const getConventions = () => list<Convention>(conventions, "/conventions");
export const getConvention = (slug: string) => one(conventions, "/conventions", slug);

/** Connect to MySQL database for user login */
export async function loginUser(credentials: { email: string; password: string }): Promise<LoginResult> {
  try {
    const res = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message = Array.isArray(data.detail)
        ? data.detail.join(", ")
        : data.detail || (res.status === 401 ? "Invalid email or password." : `Login failed (Error ${res.status}).`);
      throw new Error(message);
    }

    return data as LoginResult;
  } catch (err: any) {
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      throw new Error("Unable to connect to the database API. Please ensure the server and MySQL are running.");
    }
    throw err;
  }
}

/** Submit membership application to MySQL database */
export interface MembershipApplicationPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  university: string;
  major: string;
  year: string;
  motivation: string;
  technical: string[];
  languages: string[];
  interests: string[];
}

export async function submitApplication(data: MembershipApplicationPayload): Promise<any> {
  try {
    const res = await fetch(`${BASE}/applications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        university: data.university,
        major: data.major,
        academic_year: data.year,
        motivation: data.motivation,
        skills_interests: [...data.technical, ...data.languages, ...data.interests].join(", "),
      }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message = Array.isArray(body.detail)
        ? body.detail.join(", ")
        : body.detail || "Failed to submit application.";
      throw new Error(message);
    }

    return body;
  } catch (err: any) {
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      throw new Error("Unable to connect to the database API. Please ensure MySQL is running.");
    }
    throw err;
  }
}

export interface ApplicationItem {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  university: string;
  major: string;
  academic_year: string;
  motivation: string;
  skills_interests: string;
  cv_path?: string | null;
  status: "pending" | "approved" | "rejected";
  hr_status: "pending" | "approved" | "rejected";
  hr_rejection_reason?: string | null;
  hr_reviewed_at?: string | null;
  president_status?: "pending" | "approved" | "rejected" | null;
  president_reviewed_at?: string | null;
  created_at: string;
  reviewed_at?: string | null;
}

export type UserRole = "admin" | "president" | "hr" | "manager" | "member";

export interface UserAccountItem {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  photo_url?: string | null;
  major?: string | null;
}

export interface ClubRoleDef {
  id: UserRole;
  label: string;
  badge: string;
  description: string;
  canManageMembers: boolean;
  canReviewHr: boolean;
  canReviewPresident: boolean;
  canManageUsers: boolean;
}

export const CLUB_ROLES: ClubRoleDef[] = [
  {
    id: "admin",
    label: "Administrator",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    description: "Full access to the entire system: manage users, assign roles, all reviews, and settings.",
    canManageMembers: true,
    canReviewHr: true,
    canReviewPresident: true,
    canManageUsers: true,
  },
  {
    id: "president",
    label: "Club President",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    description: "Club leadership: makes final approval/rejection decisions on applications.",
    canManageMembers: true,
    canReviewHr: false,
    canReviewPresident: true,
    canManageUsers: false,
  },
  {
    id: "hr",
    label: "HR Responsible",
    badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    description: "Human Resources: manages members, reviews candidate applications, forwards to President.",
    canManageMembers: true,
    canReviewHr: true,
    canReviewPresident: false,
    canManageUsers: false,
  },
  {
    id: "manager",
    label: "Activities Manager",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    description: "Coordinates club workshops, formations, conventions, and events.",
    canManageMembers: false,
    canReviewHr: false,
    canReviewPresident: false,
    canManageUsers: false,
  },
  {
    id: "member",
    label: "Club Member",
    badge: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
    description: "Regular club member with access to internal formations and activities.",
    canManageMembers: false,
    canReviewHr: false,
    canReviewPresident: false,
    canManageUsers: false,
  },
];

export interface CreateUserPayload {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  is_active?: boolean;
  major?: string;
}

export async function createUser(data: CreateUserPayload): Promise<UserAccountItem> {
  const res = await fetch(`${BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.detail || "Failed to create user");
  return body;
}

/** Get list of membership applications (Admin) */
export async function getApplications(): Promise<ApplicationItem[]> {
  const res = await fetch(`${BASE}/applications`);
  if (!res.ok) throw new Error("Failed to load applications");
  return res.json();
}

/** HR review action */
export async function reviewHr(id: number, action: "approve" | "reject", reason?: string): Promise<ApplicationItem> {
  const res = await fetch(`${BASE}/applications/${id}/hr-review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, reason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to submit HR review");
  return data;
}

/** President review action */
export async function reviewPresident(id: number, action: "approve" | "reject"): Promise<ApplicationItem> {
  const res = await fetch(`${BASE}/applications/${id}/president-review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to submit President review");
  return data;
}

/** Delete application */
export async function deleteApplication(id: number): Promise<void> {
  const res = await fetch(`${BASE}/applications/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete application");
}

/** Get list of users */
export async function getUsers(): Promise<UserAccountItem[]> {
  const res = await fetch(`${BASE}/users`);
  if (!res.ok) throw new Error("Failed to load users");
  return res.json();
}

/** Get single user by ID */
export async function getUser(id: number): Promise<UserAccountItem> {
  const res = await fetch(`${BASE}/users/${id}`);
  if (!res.ok) throw new Error("Failed to load user");
  return res.json();
}

/** Update user role, active status, photo, or major */
export async function updateUser(
  id: number,
  updates: { role?: string; is_active?: boolean; photo_url?: string | null; password?: string; major?: string | null }
): Promise<UserAccountItem> {
  const res = await fetch(`${BASE}/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to update user");
  return data;
}

/** Delete user */
export async function deleteUser(id: number): Promise<void> {
  const res = await fetch(`${BASE}/users/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete user");
}

/* =========================================================
   PARTNER COMPANIES & MEMBER CONVENTION DISCOUNTS
========================================================= */

export interface PartnerCompany {
  id: number;
  name: string;
  logo_url: string;
  category?: string | null;
  default_discount: string;
  description?: string | null;
  website?: string | null;
  created_at?: string;
}

export interface MemberPartnerDiscount extends PartnerCompany {
  member_discount?: string | null;
  member_notes?: string | null;
  discount_id?: number | null;
}

/** Get list of partner companies */
export async function getPartners(): Promise<PartnerCompany[]> {
  const res = await fetch(`${BASE}/partners`);
  if (!res.ok) throw new Error("Failed to load partner companies");
  return res.json();
}

/** Create new partner company */
export async function createPartner(data: Partial<PartnerCompany>): Promise<PartnerCompany> {
  const res = await fetch(`${BASE}/partners`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.detail || "Failed to create partner company");
  return body;
}

/** Update partner company */
export async function updatePartner(id: number, data: Partial<PartnerCompany>): Promise<PartnerCompany> {
  const res = await fetch(`${BASE}/partners/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.detail || "Failed to update partner company");
  return body;
}

/** Delete partner company */
export async function deletePartner(id: number): Promise<void> {
  const res = await fetch(`${BASE}/partners/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete partner company");
}

/** Get discounts assigned to a specific member */
export async function getMemberDiscounts(userId: number): Promise<MemberPartnerDiscount[]> {
  const res = await fetch(`${BASE}/members/${userId}/discounts`);
  if (!res.ok) throw new Error("Failed to load member discounts");
  return res.json();
}

/** Assign or update a member's discount for a company */
export async function assignMemberDiscount(
  userId: number,
  data: { company_id: number; discount_rate: string; notes?: string }
): Promise<any> {
  const res = await fetch(`${BASE}/members/${userId}/discounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.detail || "Failed to assign member discount");
  return body;
}

/** Remove a member discount attribution */
export async function removeMemberDiscount(userId: number, companyId: number): Promise<void> {
  const res = await fetch(`${BASE}/members/${userId}/discounts/${companyId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to remove member discount");
}
