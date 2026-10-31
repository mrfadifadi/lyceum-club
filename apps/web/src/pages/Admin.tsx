import { useEffect, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  XCircle,
  Shield,
  Search,
  Filter,
  RefreshCw,
  LogOut,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  GraduationCap,
  BookOpen,
  Phone,
  Mail,
  Calendar,
  Trash2,
  UserCheck,
  ShieldCheck,
  LayoutDashboard,
  ClipboardList,
  Users,
  UserPlus,
  Crown,
  Globe,
  Menu,
  X,
  Lock,
  Building2,
  Percent,
  Sparkles,
  ExternalLink,
  Plus,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { GridBackdrop } from "@/components/shared/GridBackdrop";
import { Logo } from "@/components/shared/Logo";
import { getAuthUser, isAuthenticated, clearAuthSession, type AuthUser } from "@/lib/auth";
import {
  getApplications,
  reviewHr,
  reviewPresident,
  deleteApplication,
  getUsers,
  updateUser,
  deleteUser,
  createUser,
  getPartners,
  createPartner,
  deletePartner,
  getMemberDiscounts,
  assignMemberDiscount,
  removeMemberDiscount,
  CLUB_ROLES,
  type ApplicationItem,
  type UserAccountItem,
  type UserRole,
  type CreateUserPayload,
  type PartnerCompany,
  type MemberPartnerDiscount,
} from "@/services/api";
import { routes } from "@/lib/routes";

type AdminSection =
  | "overview"
  | "applications"
  | "hr_desk"
  | "president_desk"
  | "users"
  | "add_user"
  | "roles"
  | "partners";

export default function Admin() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [users, setUsers] = useState<UserAccountItem[]>([]);
  const [partners, setPartners] = useState<PartnerCompany[]>([]);
  const [currentSection, setCurrentSection] = useState<AdminSection>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // Application Details & Rejection State
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [rejectionModalId, setRejectionModalId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Add User State
  const [newUser, setNewUser] = useState<CreateUserPayload>({
    full_name: "",
    email: "",
    password: "",
    role: "hr",
    is_active: true,
    major: "Computer Science & AI",
  });
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);

  // Partner Management State
  const [newPartnerModalOpen, setNewPartnerModalOpen] = useState(false);
  const [newPartner, setNewPartner] = useState({
    name: "",
    logo_url: "/partners/cyber-tech.svg",
    category: "Tech & Hardware",
    default_discount: "20% OFF",
    description: "",
    website: "",
  });
  const [creatingPartner, setCreatingPartner] = useState(false);

  // Member Discounts Assignment State
  const [discountModalUser, setDiscountModalUser] = useState<UserAccountItem | null>(null);
  const [memberDiscounts, setMemberDiscounts] = useState<MemberPartnerDiscount[]>([]);
  const [memberDiscountsLoading, setMemberDiscountsLoading] = useState(false);
  const [discountInputs, setDiscountInputs] = useState<Record<number, string>>({});
  const [savingDiscountId, setSavingDiscountId] = useState<number | null>(null);

  // Notification Toast
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const notify = (text: string, type: "success" | "error" = "success") => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [apps, usrs, parts] = await Promise.all([getApplications(), getUsers(), getPartners()]);
      setApplications(apps);
      setUsers(usrs);
      setPartners(parts);
    } catch (err: any) {
      notify(err.message || "Failed to load database records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated()) {
      const u = getAuthUser();
      setCurrentUser(u);
      if (u && ["admin", "president", "hr", "manager"].includes(u.role.toLowerCase())) {
        // Automatically route each role to their dedicated desk/view
        if (u.role === "hr") {
          setCurrentSection("hr_desk");
        } else if (u.role === "president") {
          setCurrentSection("president_desk");
        } else {
          setCurrentSection("overview");
        }
        loadData();
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    window.location.href = routes.joinUs;
  };

  // Role permissions helpers
  const role = currentUser?.role || "member";
  const isAdmin = role === "admin";
  const isPresident = role === "president";
  const isHr = role === "hr";
  const isManager = role === "manager";

  // Section visibility permissions
  const canSeeOverview = isAdmin || isPresident || isManager;
  const canSeeApplications = isAdmin || isPresident || isHr || isManager;
  const canSeeHrDesk = isAdmin || isHr;
  const canSeePresidentDesk = isAdmin || isPresident;
  const canSeeUsers = isAdmin || isPresident || isHr || isManager;
  const canSeeAddUser = isAdmin;
  const canSeeRolesGuide = isAdmin;
  const canSeePartners = isAdmin || isPresident || isManager || isHr;

  // Action capabilities
  const canPerformHrReview = isAdmin || isHr;
  const canPerformPresidentReview = isAdmin || isPresident;
  const canManageAllRoles = isAdmin;
  const canManagePartners = isAdmin || isManager;

  // Partner Conventions and Member Discounts Handlers
  const handleOpenDiscountsModal = async (u: UserAccountItem) => {
    setDiscountModalUser(u);
    setMemberDiscountsLoading(true);
    try {
      const data = await getMemberDiscounts(u.id);
      setMemberDiscounts(data);
      const initialInputs: Record<number, string> = {};
      data.forEach((p) => {
        initialInputs[p.id] = p.member_discount || p.default_discount || "20% OFF";
      });
      setDiscountInputs(initialInputs);
    } catch (err: any) {
      notify(err.message || "Failed to load member discounts", "error");
    } finally {
      setMemberDiscountsLoading(false);
    }
  };

  const handleSaveMemberDiscount = async (companyId: number) => {
    if (!discountModalUser) return;
    const rate = (discountInputs[companyId] || "").trim();
    if (!rate) {
      notify("Please enter a discount rate (e.g. 20% OFF)", "error");
      return;
    }
    setSavingDiscountId(companyId);
    try {
      await assignMemberDiscount(discountModalUser.id, {
        company_id: companyId,
        discount_rate: rate,
      });
      const updated = await getMemberDiscounts(discountModalUser.id);
      setMemberDiscounts(updated);
      notify(`Assigned ${rate} convention rate to ${discountModalUser.full_name}`);
    } catch (err: any) {
      notify(err.message || "Failed to assign discount", "error");
    } finally {
      setSavingDiscountId(null);
    }
  };

  const handleRemoveMemberDiscount = async (companyId: number) => {
    if (!discountModalUser) return;
    setSavingDiscountId(companyId);
    try {
      await removeMemberDiscount(discountModalUser.id, companyId);
      const updated = await getMemberDiscounts(discountModalUser.id);
      setMemberDiscounts(updated);
      notify("Custom discount removed for this partner");
    } catch (err: any) {
      notify(err.message || "Failed to remove discount", "error");
    } finally {
      setSavingDiscountId(null);
    }
  };

  const handleCreatePartner = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPartner.name || !newPartner.logo_url) {
      notify("Company name and logo are required", "error");
      return;
    }
    setCreatingPartner(true);
    try {
      const created = await createPartner(newPartner);
      setPartners((prev) => [...prev, created]);
      setNewPartnerModalOpen(false);
      setNewPartner({
        name: "",
        logo_url: "/partners/cyber-tech.svg",
        category: "Tech & Hardware",
        default_discount: "20% OFF",
        description: "",
        website: "",
      });
      notify(`Partner company "${created.name}" created successfully!`);
    } catch (err: any) {
      notify(err.message || "Failed to create partner", "error");
    } finally {
      setCreatingPartner(false);
    }
  };

  const handleDeletePartner = async (id: number) => {
    if (!confirm("Are you sure you want to remove this partner company convention?")) return;
    try {
      await deletePartner(id);
      setPartners((prev) => prev.filter((p) => p.id !== id));
      notify("Partner company removed");
    } catch (err: any) {
      notify(err.message || "Failed to delete partner", "error");
    }
  };

  // HR Review Actions
  const handleHrApprove = async (appId: number) => {
    if (!canPerformHrReview) {
      notify("Only HR and Administrators can perform HR reviews.", "error");
      return;
    }
    setActionLoading(appId);
    try {
      const updated = await reviewHr(appId, "approve");
      setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));
      notify(`Application #${appId} approved by HR and forwarded to President.`);
    } catch (err: any) {
      notify(err.message || "Action failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleHrRejectSubmit = async (appId: number) => {
    if (!canPerformHrReview) {
      notify("Only HR and Administrators can perform HR reviews.", "error");
      return;
    }
    if (!rejectionReason.trim()) {
      notify("Please provide a reason explaining the rejection to the administrator.", "error");
      return;
    }
    setActionLoading(appId);
    try {
      const updated = await reviewHr(appId, "reject", rejectionReason);
      setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));
      setRejectionModalId(null);
      setRejectionReason("");
      notify(`Application #${appId} rejected by HR. Reason recorded.`);
    } catch (err: any) {
      notify(err.message || "Action failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // President Review Actions
  const handlePresidentReview = async (appId: number, action: "approve" | "reject") => {
    if (!canPerformPresidentReview) {
      notify("Only the President and Administrators can make final decisions.", "error");
      return;
    }
    setActionLoading(appId);
    try {
      const updated = await reviewPresident(appId, action);
      setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));
      notify(
        action === "approve"
          ? `Application #${appId} APPROVED by President! Member account activated in MySQL.`
          : `Application #${appId} REJECTED by President.`
      );
      getUsers().then(setUsers);
    } catch (err: any) {
      notify(err.message || "Action failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Delete application
  const handleDeleteApp = async (appId: number) => {
    if (!isAdmin) {
      notify("Only Administrators can permanently delete applications.", "error");
      return;
    }
    if (!confirm(`Delete application #${appId} permanently?`)) return;
    try {
      await deleteApplication(appId);
      setApplications((prev) => prev.filter((a) => a.id !== appId));
      notify(`Application #${appId} deleted.`);
    } catch (err: any) {
      notify(err.message || "Delete failed", "error");
    }
  };

  // Create new user with role (Admin only)
  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSeeAddUser) {
      notify("Only Administrators can create accounts and assign roles.", "error");
      return;
    }
    setCreateUserError(null);
    if (!newUser.full_name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      setCreateUserError("Please fill in all required fields (Name, Email, Password).");
      return;
    }

    setCreateUserLoading(true);
    try {
      const created = await createUser(newUser);
      setUsers((prev) => [...prev, created]);
      notify(`User ${created.full_name} created with role: ${created.role.toUpperCase()}!`);
      setNewUser({ full_name: "", email: "", password: "", role: "hr", is_active: true });
      setCurrentSection("users");
    } catch (err: any) {
      setCreateUserError(err.message || "Failed to create user.");
    } finally {
      setCreateUserLoading(false);
    }
  };

  // Change user role (Admin only)
  const handleChangeUserRole = async (userId: number, newRole: UserRole) => {
    if (!canManageAllRoles) {
      notify("Only Administrators have permission to change user roles.", "error");
      return;
    }
    try {
      const updated = await updateUser(userId, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      notify(`User role updated to ${newRole.toUpperCase()}.`);
    } catch (err: any) {
      notify(err.message || "Role change failed", "error");
    }
  };

  // Toggle user active status (Admin & HR for members)
  const handleToggleUserStatus = async (targetUser: UserAccountItem) => {
    if (isHr && targetUser.role !== "member") {
      notify("HR can only manage member accounts.", "error");
      return;
    }
    try {
      const updated = await updateUser(targetUser.id, { is_active: !targetUser.is_active });
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? updated : u)));
      notify(`User ${targetUser.email} status updated.`);
    } catch (err: any) {
      notify(err.message || "Update failed", "error");
    }
  };

  // Delete user (Admin only)
  const handleDeleteUser = async (userId: number) => {
    if (!isAdmin) {
      notify("Only Administrators can delete users.", "error");
      return;
    }
    if (!confirm(`Delete user #${userId} permanently from MySQL?`)) return;
    try {
      await deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      notify(`User deleted successfully.`);
    } catch (err: any) {
      notify(err.message || "Delete failed", "error");
    }
  };

  // Unauthorized access
  const isAuthorized =
    currentUser &&
    ["admin", "president", "hr", "manager"].includes(currentUser.role.toLowerCase());

  if (!isAuthorized) {
    return (
      <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-bg px-4 py-20">
        <GridBackdrop />
        <div className="relative mx-auto max-w-md w-full rounded-2xl border border-line bg-surface/80 p-8 text-center backdrop-blur shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30 text-red-400 mb-4">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-semibold">Staff &amp; Admin Access Required</h1>
          <p className="mt-2 text-sm text-muted">
            This dashboard is reserved for Lyceum Club staff (Administrators, President, HR Responsible). Please log in with an authorized account.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button asChild>
              <a href={routes.joinUs}>Log In with Staff Account</a>
            </Button>
            <Button variant="outline" asChild>
              <a href={routes.home}>Return to Website</a>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // Counts & Stats
  const pendingHrApps = applications.filter((a) => a.hr_status === "pending");
  const pendingPresidentApps = applications.filter(
    (a) => a.hr_status === "approved" && a.president_status !== "approved" && a.president_status !== "rejected"
  );
  const approvedApps = applications.filter((a) => a.status === "approved");
  const rejectedApps = applications.filter((a) => a.status === "rejected");

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      `${app.first_name} ${app.last_name} ${app.email} ${app.university} ${app.major}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (currentSection === "hr_desk") return app.hr_status === "pending";
    if (currentSection === "president_desk")
      return app.hr_status === "approved" && app.president_status !== "approved" && app.president_status !== "rejected";

    if (statusFilter === "all") return true;
    if (statusFilter === "pending_hr") return app.hr_status === "pending";
    if (statusFilter === "pending_president")
      return app.hr_status === "approved" && app.president_status !== "approved" && app.president_status !== "rejected";
    if (statusFilter === "approved") return app.status === "approved";
    if (statusFilter === "rejected") return app.status === "rejected";
    return true;
  });

  // HR only sees members; Admin/President sees all users
  const visibleUsers = isHr ? users.filter((u) => u.role === "member") : users;

  const filteredUsers = visibleUsers.filter((u) => {
    const matchesSearch = `${u.full_name} ${u.email}`.toLowerCase().includes(userSearchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (userRoleFilter === "all") return true;
    return u.role === userRoleFilter;
  });

  const getRoleDef = (userRole: string) =>
    CLUB_ROLES.find((r) => r.id === userRole) || {
      id: userRole as UserRole,
      label: userRole.toUpperCase(),
      badge: "bg-surface border-line text-muted",
      description: "",
      canManageMembers: false,
      canReviewHr: false,
      canReviewPresident: false,
      canManageUsers: false,
    };

  return (
    <div className="flex min-h-[100svh] bg-bg text-fg">
      {/* Floating Notification */}
      {notification && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border p-4 text-xs font-medium shadow-2xl backdrop-blur transition-all duration-300 ${
            notification.type === "success"
              ? "border-green-500/40 bg-green-950/90 text-green-200"
              : "border-red-500/40 bg-red-950/90 text-red-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR: Shows ONLY sections the user has permissions for */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-line bg-surface/95 backdrop-blur-md transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <div className="flex items-center gap-3">
            <Logo className="h-8" />
            <div>
              <p className="font-display text-sm font-semibold leading-tight">Lyceum Club</p>
              <p className="text-[11px] text-zinc-400">Batna · Management</p>
            </div>
          </div>
          <button
            type="button"
            className="text-muted hover:text-fg lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current User Profile Card */}
        <div className="border-b border-line/80 p-4">
          <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/60 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fg text-bg font-bold text-sm">
              {currentUser?.full_name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-fg">{currentUser?.full_name}</p>
              <p className="truncate text-[11px] text-muted">{currentUser?.email}</p>
              <span
                className={`mt-1 inline-block rounded-full px-2 py-0.2 text-[9px] font-semibold border ${
                  getRoleDef(currentUser?.role || "").badge
                }`}
              >
                {getRoleDef(currentUser?.role || "").label}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Navigation Sections according to Role */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4 text-xs">
          {canSeeOverview && (
            <>
              <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted">Dashboard</p>
              <button
                type="button"
                onClick={() => {
                  setCurrentSection("overview");
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-colors ${
                  currentSection === "overview"
                    ? "bg-fg text-bg shadow-sm"
                    : "text-muted hover:bg-surface-2 hover:text-fg"
                }`}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                <span>Overview &amp; Metrics</span>
              </button>
            </>
          )}

          {canSeeApplications && (
            <>
              <p className="pt-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted">
                Applications Desk
              </p>

              {/* HR Desk: Visible to HR and Admin */}
              {canSeeHrDesk && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentSection("hr_desk");
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 font-medium transition-colors ${
                    currentSection === "hr_desk"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-muted hover:bg-surface-2 hover:text-fg"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-4 w-4 shrink-0" />
                    <span>1. HR Review Desk</span>
                  </div>
                  {pendingHrApps.length > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-black text-[10px] font-bold">
                      {pendingHrApps.length}
                    </span>
                  )}
                </button>
              )}

              {/* President Desk: Visible to President and Admin */}
              {canSeePresidentDesk && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentSection("president_desk");
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 font-medium transition-colors ${
                    currentSection === "president_desk"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-muted hover:bg-surface-2 hover:text-fg"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Crown className="h-4 w-4 shrink-0" />
                    <span>2. President Decisions</span>
                  </div>
                  {pendingPresidentApps.length > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-400 text-black text-[10px] font-bold">
                      {pendingPresidentApps.length}
                    </span>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setCurrentSection("applications");
                  setStatusFilter("all");
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 font-medium transition-colors ${
                  currentSection === "applications"
                    ? "bg-fg text-bg shadow-sm"
                    : "text-muted hover:bg-surface-2 hover:text-fg"
                }`}
              >
                <div className="flex items-center gap-3">
                  <ClipboardList className="h-4 w-4 shrink-0" />
                  <span>All Applications</span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
                    currentSection === "applications" ? "bg-bg text-fg font-bold" : "bg-surface-2 text-muted"
                  }`}
                >
                  {applications.length}
                </span>
              </button>
            </>
          )}

          {canSeeUsers && (
            <>
              <p className="pt-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted">
                {isHr ? "Members Management" : "Users & Access"}
              </p>

              <button
                type="button"
                onClick={() => {
                  setCurrentSection("users");
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 font-medium transition-colors ${
                  currentSection === "users"
                    ? "bg-fg text-bg shadow-sm"
                    : "text-muted hover:bg-surface-2 hover:text-fg"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 shrink-0" />
                  <span>{isHr ? "Club Members" : "Members & Staff"}</span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
                    currentSection === "users" ? "bg-bg text-fg font-bold" : "bg-surface-2 text-muted"
                  }`}
                >
                  {visibleUsers.length}
                </span>
              </button>

              {/* Add User: Admin only */}
              {canSeeAddUser && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentSection("add_user");
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-colors ${
                    currentSection === "add_user"
                      ? "bg-fg text-bg shadow-sm"
                      : "text-muted hover:bg-surface-2 hover:text-fg"
                  }`}
                >
                  <UserPlus className="h-4 w-4 shrink-0" />
                  <span>Add New User &amp; Role</span>
                </button>
              )}

              {/* Roles Guide: Admin only */}
              {canSeeRolesGuide && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentSection("roles");
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-colors ${
                    currentSection === "roles"
                      ? "bg-fg text-bg shadow-sm"
                      : "text-muted hover:bg-surface-2 hover:text-fg"
                  }`}
                >
                  <Shield className="h-4 w-4 shrink-0" />
                  <span>Roles &amp; Privileges</span>
                </button>
              )}
            </>
          )}

          {canSeePartners && (
            <>
              <p className="pt-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted">
                Conventions &amp; Partners
              </p>

              <button
                type="button"
                onClick={() => {
                  setCurrentSection("partners");
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 font-medium transition-colors ${
                  currentSection === "partners"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-muted hover:bg-surface-2 hover:text-fg"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span>Partner Conventions</span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
                    currentSection === "partners" ? "bg-white text-black font-bold" : "bg-surface-2 text-muted"
                  }`}
                >
                  {partners.length}
                </span>
              </button>
            </>
          )}
        </nav>

        {/* Sidebar Bottom Footer */}
        <div className="border-t border-line p-3 space-y-1 text-xs">
          <Button variant="ghost" size="sm" asChild className="w-full justify-start text-muted hover:text-fg">
            <a href={routes.home}>
              <Globe className="h-4 w-4 mr-2" />
              Return to Website
            </a>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-line bg-surface/50 px-5 sm:px-8 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-muted hover:text-fg lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="font-display text-lg font-semibold capitalize">
              {currentSection === "overview" && "Dashboard Overview"}
              {currentSection === "applications" && "Membership Applications"}
              {currentSection === "hr_desk" && "HR Review Desk (Stage 1)"}
              {currentSection === "president_desk" && "President Decision Desk (Stage 2)"}
              {currentSection === "users" && (isHr ? "Club Members Management" : "User & Role Management")}
              {currentSection === "add_user" && "Add New User & Assign Role"}
              {currentSection === "roles" && "Club Roles & Permissions Guide"}
              {currentSection === "partners" && "Partner Companies & Conventions"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="text-xs">
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Sync MySQL
            </Button>
            {canSeeAddUser && (
              <Button
                size="sm"
                onClick={() => setCurrentSection("add_user")}
                className="text-xs max-sm:hidden"
              >
                <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                Add User
              </Button>
            )}
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-8">
          {/* SECTION 1: OVERVIEW (Admin & President) */}
          {currentSection === "overview" && canSeeOverview && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                <div
                  onClick={() => setCurrentSection("applications")}
                  className="cursor-pointer rounded-2xl border border-line bg-surface/70 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-fg/40"
                >
                  <div className="flex items-center justify-between text-muted">
                    <span className="text-xs font-medium">Applications</span>
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <p className="mt-3 font-display text-3xl font-bold">{applications.length}</p>
                  <p className="mt-1 text-[11px] text-muted">Total received</p>
                </div>

                {canSeeHrDesk && (
                  <div
                    onClick={() => setCurrentSection("hr_desk")}
                    className="cursor-pointer rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-yellow-400"
                  >
                    <div className="flex items-center justify-between text-yellow-300">
                      <span className="text-xs font-medium">1. Pending HR</span>
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <p className="mt-3 font-display text-3xl font-bold text-yellow-400">{pendingHrApps.length}</p>
                    <p className="mt-1 text-[11px] text-yellow-300/80">Stage 1: HR</p>
                  </div>
                )}

                {canSeePresidentDesk && (
                  <div
                    onClick={() => setCurrentSection("president_desk")}
                    className="cursor-pointer rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-400"
                  >
                    <div className="flex items-center justify-between text-blue-300">
                      <span className="text-xs font-medium">2. Pending President</span>
                      <Crown className="h-4 w-4" />
                    </div>
                    <p className="mt-3 font-display text-3xl font-bold text-blue-400">
                      {pendingPresidentApps.length}
                    </p>
                    <p className="mt-1 text-[11px] text-blue-300/80">Stage 2: President</p>
                  </div>
                )}

                <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-5 shadow-sm">
                  <div className="flex items-center justify-between text-green-300">
                    <span className="text-xs font-medium">Approved</span>
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <p className="mt-3 font-display text-3xl font-bold text-green-400">{approvedApps.length}</p>
                  <p className="mt-1 text-[11px] text-green-300/80">Active members</p>
                </div>

                <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 shadow-sm">
                  <div className="flex items-center justify-between text-red-300">
                    <span className="text-xs font-medium">Rejected</span>
                    <XCircle className="h-4 w-4" />
                  </div>
                  <p className="mt-3 font-display text-3xl font-bold text-red-400">{rejectedApps.length}</p>
                  <p className="mt-1 text-[11px] text-red-300/80">Declined</p>
                </div>

                <div
                  onClick={() => setCurrentSection("users")}
                  className="cursor-pointer rounded-2xl border border-line bg-surface/70 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-fg/40"
                >
                  <div className="flex items-center justify-between text-muted">
                    <span className="text-xs font-medium">Total Users</span>
                    <Users className="h-4 w-4" />
                  </div>
                  <p className="mt-3 font-display text-3xl font-bold">{users.length}</p>
                  <p className="mt-1 text-[11px] text-muted">Accounts in MySQL</p>
                </div>
              </div>

              {/* Action Desks */}
              <div className="grid gap-6 md:grid-cols-2">
                {canSeeHrDesk && (
                  <div className="rounded-2xl border border-line bg-surface/60 p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
                        <UserCheck className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="font-display font-semibold text-base">Stage 1: HR Review Desk</h3>
                        <p className="text-xs text-muted">Screen candidate profiles, academic field, and motivation.</p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-line/60 bg-surface-2/40 p-4 text-xs space-y-2">
                      <p className="font-medium text-fg">
                        {pendingHrApps.length > 0 ? (
                          <span className="text-yellow-400 font-semibold">{pendingHrApps.length} application(s) awaiting HR</span>
                        ) : (
                          <span className="text-green-400">All submissions reviewed</span>
                        )}
                      </p>
                      <p className="text-muted">
                        HR can approve applications (forwarding them to President) or reject them with a mandatory explanation reason.
                      </p>
                    </div>
                    <Button onClick={() => setCurrentSection("hr_desk")} className="w-full text-xs">
                      Open HR Review Desk
                    </Button>
                  </div>
                )}

                {canSeePresidentDesk && (
                  <div className="rounded-2xl border border-line bg-surface/60 p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        <Crown className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="font-display font-semibold text-base">Stage 2: President Decision Desk</h3>
                        <p className="text-xs text-muted">Final executive approval or rejection of HR-screened candidates.</p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-line/60 bg-surface-2/40 p-4 text-xs space-y-2">
                      <p className="font-medium text-fg">
                        {pendingPresidentApps.length > 0 ? (
                          <span className="text-blue-400 font-semibold">
                            {pendingPresidentApps.length} candidate(s) awaiting final decision
                          </span>
                        ) : (
                          <span className="text-muted">No pending candidates forwarded from HR.</span>
                        )}
                      </p>
                      <p className="text-muted">
                        Approval activates the candidate's member account in MySQL so they can sign in immediately.
                      </p>
                    </div>
                    <Button
                      onClick={() => setCurrentSection("president_desk")}
                      variant="outline"
                      className="w-full text-xs"
                    >
                      Open President Decision Desk
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}



          {/* SECTION 8: PARTNER CONVENTIONS (Admin & Manager) */}
          {currentSection === "partners" && canSeePartners && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-display text-2xl font-semibold flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-emerald-400" />
                    Partner Companies &amp; Conventions
                  </h3>
                  <p className="mt-1 text-xs text-muted max-w-xl">
                    Manage official partner agreements and conventions. To attribute custom discount rates to individual members, go to the <strong>Users</strong> tab and click <strong>Discounts</strong>.
                  </p>
                </div>

                {canManagePartners && (
                  <Button
                    size="sm"
                    onClick={() => setNewPartnerModalOpen(true)}
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add Partner Company
                  </Button>
                )}
              </div>

              {/* Partners Grid */}
              {partners.length === 0 ? (
                <div className="rounded-2xl border border-line bg-surface/40 p-12 text-center space-y-3">
                  <Building2 className="mx-auto h-12 w-12 text-muted/40" />
                  <p className="text-muted text-sm font-medium">No partner companies registered yet.</p>
                  <Button size="sm" onClick={() => setNewPartnerModalOpen(true)} className="text-xs">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Register First Partner
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {partners.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-2xl border border-line bg-surface/70 p-5 flex flex-col justify-between space-y-4 shadow-sm hover:border-emerald-500/40 transition-colors"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-14 w-14 rounded-xl bg-zinc-950 border border-zinc-800 p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                              <img src={p.logo_url} alt={p.name} className="h-full w-full object-contain" />
                            </div>
                            <div>
                              <h4 className="font-display font-semibold text-sm text-fg">{p.name}</h4>
                              <span className="text-[10px] text-muted font-mono uppercase tracking-wider block">
                                {p.category || "Convention"}
                              </span>
                            </div>
                          </div>

                          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-xs px-2.5 py-0.5">
                            {p.default_discount}
                          </span>
                        </div>

                        {p.description && (
                          <p className="text-xs text-muted leading-relaxed line-clamp-2">{p.description}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-line/60 text-xs">
                        {p.website ? (
                          <a
                            href={p.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-muted hover:text-emerald-400 flex items-center gap-1 font-mono"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {p.website.replace(/^https?:\/\//, "")}
                          </a>
                        ) : (
                          <span className="text-[11px] text-muted font-mono">Batna Convention</span>
                        )}

                        {isAdmin && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted hover:text-red-400"
                            onClick={() => handleDeletePartner(p.id)}
                            title="Delete partner company"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* MODAL 1: ASSIGN MEMBER PARTNER DISCOUNTS */}
          {/* ======================================================== */}
          {discountModalUser && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setDiscountModalUser(null)}
            >
              <div
                className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-2xl space-y-6"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setDiscountModalUser(null)}
                  className="absolute right-5 top-5 rounded-full p-1.5 text-muted hover:text-fg hover:bg-surface-2 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-4 pb-4 border-b border-line">
                  <div className="h-12 w-12 rounded-full bg-surface-2 border border-line flex items-center justify-center font-bold text-base overflow-hidden shrink-0">
                    {discountModalUser.photo_url ? (
                      <img src={discountModalUser.photo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      discountModalUser.full_name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-fg">
                      Assign Partner Discounts: {discountModalUser.full_name}
                    </h3>
                    <p className="text-xs text-muted font-mono">
                      Member #{discountModalUser.id} &bull; {discountModalUser.email} &bull; {discountModalUser.major || "Computer Science"}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-200 space-y-1">
                  <p className="font-semibold text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    Personalized Member Conventions
                  </p>
                  <p>
                    Set custom discounts for this specific member (e.g., 20% at Cyber Tech, 40% at The Hive). When they swipe up their digital card, these rates will appear on their squares.
                  </p>
                </div>

                {/* Partners List */}
                {memberDiscountsLoading ? (
                  <div className="py-12 text-center text-xs text-muted font-mono">
                    Loading member discounts…
                  </div>
                ) : memberDiscounts.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted">
                    No partner companies registered yet. Create partners in the "Partners" tab first.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {memberDiscounts.map((partner) => {
                      const hasAssigned = Boolean(partner.member_discount);
                      const currentVal = discountInputs[partner.id] || "";
                      const isSaving = savingDiscountId === partner.id;

                      return (
                        <div
                          key={partner.id}
                          className={`rounded-2xl border p-4 space-y-3 transition-colors ${
                            hasAssigned
                              ? "border-emerald-500/40 bg-emerald-950/20"
                              : "border-line bg-surface-2/40"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="h-11 w-11 rounded-xl bg-zinc-950 border border-zinc-800 p-1.5 flex items-center justify-center shrink-0">
                                <img src={partner.logo_url} alt="" className="h-full w-full object-contain" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-xs text-fg">{partner.name}</h4>
                                <span className="text-[10px] text-muted font-mono uppercase">
                                  {partner.category || "Convention"} &bull; Standard: {partner.default_discount}
                                </span>
                              </div>
                            </div>

                            <div>
                              {hasAssigned ? (
                                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs px-2.5 py-0.5">
                                  Current: {partner.member_discount}
                                </span>
                              ) : (
                                <span className="text-[11px] text-muted font-mono">
                                  Default ({partner.default_discount})
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Fast preset percentages */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] text-muted mr-1">Presets:</span>
                            {["15% OFF", "20% OFF", "25% OFF", "30% OFF", "40% OFF", "50% OFF"].map((rate) => (
                              <button
                                key={rate}
                                type="button"
                                onClick={() => setDiscountInputs((prev) => ({ ...prev, [partner.id]: rate }))}
                                className={`rounded-lg px-2 py-0.5 text-[10px] font-mono border transition-colors ${
                                  currentVal === rate
                                    ? "bg-emerald-500 text-black font-bold border-emerald-400"
                                    : "bg-surface border-line text-muted hover:text-fg hover:border-fg/40"
                                }`}
                              >
                                {rate}
                              </button>
                            ))}
                          </div>

                          {/* Custom Input + Save Button */}
                          <div className="flex items-center gap-2 pt-1">
                            <Input
                              value={currentVal}
                              onChange={(e) =>
                                setDiscountInputs((prev) => ({ ...prev, [partner.id]: e.target.value }))
                              }
                              placeholder="e.g. 20% OFF or 40% OFF"
                              className="text-xs h-8 max-w-[200px]"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSaveMemberDiscount(partner.id)}
                              disabled={isSaving}
                              className="text-xs h-8 bg-emerald-600 hover:bg-emerald-500 text-white"
                            >
                              {isSaving ? "Saving…" : "Save Discount"}
                            </Button>

                            {hasAssigned && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemoveMemberDiscount(partner.id)}
                                disabled={isSaving}
                                className="text-xs h-8 border-red-500/30 text-red-300 hover:bg-red-500/10"
                              >
                                Reset to Default
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button size="sm" onClick={() => setDiscountModalUser(null)} className="text-xs">
                    Done
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODAL 2: ADD NEW PARTNER COMPANY */}
          {/* ======================================================== */}
          {newPartnerModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setNewPartnerModalOpen(false)}
            >
              <div
                className="relative w-full max-w-lg rounded-3xl border border-line bg-surface p-6 sm:p-7 shadow-2xl space-y-5"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setNewPartnerModalOpen(false)}
                  className="absolute right-4 top-4 rounded-full p-1.5 text-muted hover:text-fg hover:bg-surface-2 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>

                <div>
                  <h3 className="font-display text-xl font-bold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-emerald-400" />
                    Register New Partner Company
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    Add a convention agreement. Members will see this partner in their card background grid.
                  </p>
                </div>

                <form onSubmit={handleCreatePartner} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Company Name</label>
                    <Input
                      required
                      placeholder="e.g. Batna Cyber Tech"
                      value={newPartner.name}
                      onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300">Category</label>
                      <Select
                        value={newPartner.category}
                        onChange={(e) => setNewPartner({ ...newPartner, category: e.target.value })}
                        className="text-xs h-9"
                      >
                        <option value="Tech & Hardware">Tech &amp; Hardware</option>
                        <option value="Printing & Academia">Printing &amp; Academia</option>
                        <option value="Languages & Testing">Languages &amp; Testing</option>
                        <option value="Coworking & Coffee">Coworking &amp; Coffee</option>
                        <option value="Textbooks & Supplies">Textbooks &amp; Supplies</option>
                        <option value="Fitness & Wellness">Fitness &amp; Wellness</option>
                        <option value="Other Convention">Other Convention</option>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300">Default Discount Rate</label>
                      <Input
                        required
                        placeholder="e.g. 20% OFF"
                        value={newPartner.default_discount}
                        onChange={(e) => setNewPartner({ ...newPartner, default_discount: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* Logo URL with quick-pick presets */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                      <span>Logo URL / Preset</span>
                      {newPartner.logo_url && (
                        <span className="text-[10px] text-emerald-400 font-mono">Preview Ready</span>
                      )}
                    </label>

                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-zinc-950 border border-zinc-800 p-2 flex items-center justify-center shrink-0">
                        {newPartner.logo_url ? (
                          <img src={newPartner.logo_url} alt="Preview" className="h-full w-full object-contain" />
                        ) : (
                          <Building2 className="h-5 w-5 text-zinc-600" />
                        )}
                      </div>
                      <Input
                        required
                        placeholder="https://... or /partners/cyber-tech.svg"
                        value={newPartner.logo_url}
                        onChange={(e) => setNewPartner({ ...newPartner, logo_url: e.target.value })}
                        className="text-xs"
                      />
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-muted mr-1">Presets:</span>
                      {[
                        { label: "Tech", path: "/partners/cyber-tech.svg" },
                        { label: "Printing", path: "/partners/el-amel-print.svg" },
                        { label: "Languages", path: "/partners/cambridge-lang.svg" },
                        { label: "Coworking", path: "/partners/the-hive.svg" },
                        { label: "Books", path: "/partners/librairie-univ.svg" },
                        { label: "Fitness", path: "/partners/olympia-fitness.svg" },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setNewPartner({ ...newPartner, logo_url: preset.path })}
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-mono border transition-colors ${
                            newPartner.logo_url === preset.path
                              ? "bg-emerald-500 text-black font-bold border-emerald-400"
                              : "bg-surface border-line text-muted hover:text-fg"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Website URL (Optional)</label>
                    <Input
                      placeholder="https://example.dz"
                      value={newPartner.website}
                      onChange={(e) => setNewPartner({ ...newPartner, website: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Convention Description (Optional)</label>
                    <Textarea
                      rows={2}
                      placeholder="Special conditions, perks, or instructions for members…"
                      value={newPartner.description}
                      onChange={(e) => setNewPartner({ ...newPartner, description: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewPartnerModalOpen(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={creatingPartner}
                      className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      {creatingPartner ? "Creating…" : "Save Partner"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* SECTION 2, 3, 4: APPLICATIONS & REVIEW DESKS */}
          {(currentSection === "applications" ||
            currentSection === "hr_desk" ||
            currentSection === "president_desk") && (
            <div className="space-y-6">
              {/* Header explanation for dedicated desks */}
              {currentSection === "hr_desk" && (
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-xs text-blue-200 space-y-1">
                  <p className="font-semibold text-blue-100 flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4" />
                    HR Department Desk — Candidate Review
                  </p>
                  <p>
                    Review candidate details. Approve valid applications to forward to the President, or reject with a documented reason explaining why.
                  </p>
                </div>
              )}

              {currentSection === "president_desk" && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200 space-y-1">
                  <p className="font-semibold text-amber-100 flex items-center gap-1.5">
                    <Crown className="h-4 w-4" />
                    President Decision Desk — Final Executive Approvals
                  </p>
                  <p>
                    These candidates have passed initial review by HR. Making the final approval automatically creates their member login account in MySQL.
                  </p>
                </div>
              )}

              {/* Filters & Search */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <Input
                    placeholder="Search by name, email, university…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 text-xs"
                  />
                </div>

                {currentSection === "applications" && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-muted mr-1 flex items-center gap-1">
                      <Filter className="h-3.5 w-3.5" /> Filter:
                    </span>
                    {[
                      { id: "all", label: "All" },
                      { id: "pending_hr", label: "Pending HR" },
                      { id: "pending_president", label: "Pending President" },
                      { id: "approved", label: "Approved" },
                      { id: "rejected", label: "Rejected" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                          statusFilter === f.id
                            ? "bg-fg text-bg"
                            : "bg-surface border border-line text-muted hover:text-fg"
                        }`}
                        onClick={() => setStatusFilter(f.id)}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Applications List */}
              {filteredApps.length === 0 ? (
                <div className="rounded-2xl border border-line bg-surface/40 p-12 text-center space-y-2">
                  <ClipboardList className="mx-auto h-10 w-10 text-muted/50" />
                  <p className="text-muted text-sm font-medium">No applications found in this section.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredApps.map((app) => {
                    const isExpanded = expandedId === app.id;
                    const isPendingHr = app.hr_status === "pending";
                    const isHrApproved = app.hr_status === "approved";
                    const isPendingPres =
                      isHrApproved && app.president_status !== "approved" && app.president_status !== "rejected";

                    return (
                      <div
                        key={app.id}
                        className="rounded-xl border border-line bg-surface/70 transition-all hover:border-fg/40 shadow-sm"
                      >
                        {/* Summary Row */}
                        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2.5">
                              <span className="font-semibold text-base">
                                {app.first_name} {app.last_name}
                              </span>
                              <span className="text-xs text-muted font-mono">#{app.id}</span>

                              {app.status === "approved" ? (
                                <span className="rounded-full bg-green-500/15 border border-green-500/30 px-2.5 py-0.5 text-xs font-medium text-green-300">
                                  Approved
                                </span>
                              ) : app.status === "rejected" ? (
                                <span className="rounded-full bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 text-xs font-medium text-red-300">
                                  Rejected
                                </span>
                              ) : isPendingPres ? (
                                <span className="rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-xs font-medium text-blue-300">
                                  Awaiting President
                                </span>
                              ) : (
                                <span className="rounded-full bg-yellow-500/15 border border-yellow-500/30 px-2.5 py-0.5 text-xs font-medium text-yellow-300">
                                  Awaiting HR
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5" />
                                {app.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5" />
                                {app.phone}
                              </span>
                              <span className="flex items-center gap-1">
                                <GraduationCap className="h-3.5 w-3.5" />
                                {app.university}
                              </span>
                              <span className="flex items-center gap-1">
                                <BookOpen className="h-3.5 w-3.5" />
                                {app.major} ({app.academic_year})
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedId(isExpanded ? null : app.id)}
                              className="text-xs"
                            >
                              {isExpanded ? (
                                <>
                                  Hide details <ChevronUp className="h-4 w-4 ml-1" />
                                </>
                              ) : (
                                <>
                                  View details <ChevronDown className="h-4 w-4 ml-1" />
                                </>
                              )}
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteApp(app.id)}
                                className="text-muted hover:text-red-400"
                                title="Delete application"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Expanded Area */}
                        {isExpanded && (
                          <div className="border-t border-line/70 bg-surface-2/40 p-5 space-y-5 rounded-b-xl">
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <p className="text-xs font-medium text-muted mb-1">Motivation Statement:</p>
                                <div className="rounded-lg border border-line bg-surface p-3 text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                                  {app.motivation}
                                </div>
                              </div>
                              <div className="space-y-3">
                                {app.skills_interests && (
                                  <div>
                                    <p className="text-xs font-medium text-muted mb-1">Skills &amp; Interests:</p>
                                    <div className="rounded-lg border border-line bg-surface p-3 text-xs text-zinc-300">
                                      {app.skills_interests}
                                    </div>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-xs text-muted">
                                  <Calendar className="h-3.5 w-3.5" />
                                  <span>Applied on: {new Date(app.created_at).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>

                            {app.hr_rejection_reason && (
                              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                                <p className="font-semibold text-red-200">Rejection Reason recorded by HR:</p>
                                <p className="mt-1">{app.hr_rejection_reason}</p>
                              </div>
                            )}

                            {/* Actions Area: Role Protected */}
                            <div className="rounded-xl border border-line bg-surface p-4 space-y-4">
                              <h4 className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
                                Review &amp; Decision Workflow
                              </h4>

                              <div className="grid gap-4 md:grid-cols-2">
                                {/* HR Box */}
                                <div className="rounded-lg border border-line p-3.5 space-y-2.5">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-xs text-fg flex items-center gap-1.5">
                                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-surface-2 text-[10px]">
                                        1
                                      </span>
                                      HR Review Desk
                                    </span>
                                    <span className="text-[11px] font-mono">
                                      {app.hr_status === "approved" ? (
                                        <span className="text-green-400">✓ Approved</span>
                                      ) : app.hr_status === "rejected" ? (
                                        <span className="text-red-400">✗ Rejected</span>
                                      ) : (
                                        <span className="text-yellow-400">⏳ Pending Review</span>
                                      )}
                                    </span>
                                  </div>

                                  {isPendingHr && canPerformHrReview ? (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                      <Button
                                        size="sm"
                                        disabled={actionLoading === app.id}
                                        onClick={() => handleHrApprove(app.id)}
                                        className="text-xs bg-green-600 hover:bg-green-500 text-white"
                                      >
                                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                        HR: Approve &amp; Forward
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={actionLoading === app.id}
                                        onClick={() => {
                                          setRejectionModalId(app.id);
                                          setRejectionReason("");
                                        }}
                                        className="text-xs border-red-500/40 text-red-300 hover:bg-red-500/10"
                                      >
                                        <XCircle className="h-3.5 w-3.5 mr-1" />
                                        HR: Reject with Reason…
                                      </Button>
                                    </div>
                                  ) : (
                                    <p className="text-[11px] text-muted">
                                      {app.hr_reviewed_at ? (
                                        <>Reviewed on: {new Date(app.hr_reviewed_at).toLocaleDateString()}</>
                                      ) : !canPerformHrReview ? (
                                        <>Action restricted to HR Department.</>
                                      ) : null}
                                    </p>
                                  )}
                                </div>

                                {/* President Box */}
                                <div className="rounded-lg border border-line p-3.5 space-y-2.5">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-xs text-fg flex items-center gap-1.5">
                                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-surface-2 text-[10px]">
                                        2
                                      </span>
                                      President Final Decision
                                    </span>
                                    <span className="text-[11px] font-mono">
                                      {app.president_status === "approved" ? (
                                        <span className="text-green-400">✓ Final Approval</span>
                                      ) : app.president_status === "rejected" ? (
                                        <span className="text-red-400">✗ Final Rejection</span>
                                      ) : isPendingPres ? (
                                        <span className="text-blue-400">⏳ Awaiting Decision</span>
                                      ) : (
                                        <span className="text-muted">Awaiting HR Approval First</span>
                                      )}
                                    </span>
                                  </div>

                                  {isPendingPres && canPerformPresidentReview ? (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                      <Button
                                        size="sm"
                                        disabled={actionLoading === app.id}
                                        onClick={() => handlePresidentReview(app.id, "approve")}
                                        className="text-xs bg-fg text-bg hover:opacity-90 font-semibold"
                                      >
                                        <UserCheck className="h-3.5 w-3.5 mr-1" />
                                        President: Approve Member
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={actionLoading === app.id}
                                        onClick={() => handlePresidentReview(app.id, "reject")}
                                        className="text-xs border-red-500/40 text-red-300 hover:bg-red-500/10"
                                      >
                                        <XCircle className="h-3.5 w-3.5 mr-1" />
                                        President: Reject
                                      </Button>
                                    </div>
                                  ) : (
                                    <p className="text-[11px] text-muted">
                                      {app.president_reviewed_at ? (
                                        <>Decided on: {new Date(app.president_reviewed_at).toLocaleDateString()}</>
                                      ) : !isHrApproved ? (
                                        <>Must be approved by HR first.</>
                                      ) : !canPerformPresidentReview ? (
                                        <>Action restricted to Club President.</>
                                      ) : null}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Rejection Modal Area */}
                        {rejectionModalId === app.id && (
                          <div className="border-t border-red-500/30 bg-red-950/20 p-5 space-y-3 rounded-b-xl">
                            <p className="text-xs font-semibold text-red-300 flex items-center gap-1.5">
                              <AlertTriangle className="h-4 w-4" />
                              Provide reason explaining rejection to administrator (Required by HR policy):
                            </p>
                            <Textarea
                              rows={3}
                              placeholder="E.g. Incomplete application, non-eligible university level, or outside club recruitment scope…"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              className="text-xs border-red-500/40"
                            />
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                className="bg-red-600 hover:bg-red-500 text-white text-xs"
                                onClick={() => handleHrRejectSubmit(app.id)}
                              >
                                Confirm HR Rejection
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setRejectionModalId(null)}
                                className="text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECTION 5: USERS & MEMBERS (HR controls members, Admin controls all) */}
          {currentSection === "users" && canSeeUsers && (
            <div className="space-y-6">
              {/* Top Bar for users */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <Input
                    placeholder="Search by name or email…"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="pl-9 text-xs"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!isHr && (
                    <>
                      <span className="text-xs text-muted">Role filter:</span>
                      <Select
                        value={userRoleFilter}
                        onChange={(e) => setUserRoleFilter(e.target.value)}
                        className="w-36 text-xs h-8"
                      >
                        <option value="all">All Roles ({visibleUsers.length})</option>
                        {CLUB_ROLES.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label}
                          </option>
                        ))}
                      </Select>
                    </>
                  )}
                  {canSeeAddUser && (
                    <Button size="sm" onClick={() => setCurrentSection("add_user")} className="text-xs">
                      <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                      New User
                    </Button>
                  )}
                </div>
              </div>

              {/* Users Table */}
              <div className="rounded-xl border border-line bg-surface/70 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-2 border-b border-line text-muted">
                      <tr>
                        <th className="px-4 py-3 font-medium">User</th>
                        <th className="px-4 py-3 font-medium">Email</th>
                        <th className="px-4 py-3 font-medium">Major</th>
                        <th className="px-4 py-3 font-medium">Role</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Joined Date</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {filteredUsers.map((u) => {
                        const roleDef = getRoleDef(u.role);
                        return (
                          <tr key={u.id} className="hover:bg-surface-2/30 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 font-bold text-xs border border-line overflow-hidden shrink-0">
                                  {u.photo_url ? (
                                    <img src={u.photo_url} alt={u.full_name} className="h-full w-full object-cover" />
                                  ) : (
                                    u.full_name?.charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-fg">{u.full_name}</p>
                                  <p className="text-[10px] text-muted font-mono">#{u.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted">{u.email}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-fg truncate max-w-[130px]" title={u.major || "Computer Science & AI"}>
                                  {u.major || "Computer Science"}
                                </span>
                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newMajor = window.prompt("Enter academic major for " + u.full_name + ":", u.major || "Computer Science & AI");
                                      if (newMajor !== null) {
                                        updateUser(u.id, { major: newMajor.trim() || null })
                                          .then((updated) => {
                                            setUsers((prev) => prev.map((x) => (x.id === updated.id ? { ...x, major: updated.major } : x)));
                                            notify("Major updated for " + u.full_name);
                                          })
                                          .catch((err) => notify(err.message, "error"));
                                      }
                                    }}
                                    className="text-[10px] text-muted hover:text-emerald-400 p-0.5 rounded cursor-pointer"
                                    title="Edit Major"
                                  >
                                    ✎
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {canManageAllRoles ? (
                                <Select
                                  value={u.role}
                                  onChange={(e) => handleChangeUserRole(u.id, e.target.value as UserRole)}
                                  className={`text-[11px] h-7 px-2 font-medium border ${roleDef.badge}`}
                                >
                                  {CLUB_ROLES.map((r) => (
                                    <option key={r.id} value={r.id}>
                                      {r.label}
                                    </option>
                                  ))}
                                </Select>
                              ) : (
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${roleDef.badge}`}>
                                  {roleDef.label}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  u.is_active ? "text-green-400 bg-green-500/10" : "text-yellow-400 bg-yellow-500/10"
                                }`}
                              >
                                {u.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted">
                              {u.created_at ? new Date(u.created_at).toLocaleDateString() : "-"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                {(isAdmin || (isHr && u.role === "member")) && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-[11px] h-7 px-2 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
                                      onClick={() => handleOpenDiscountsModal(u)}
                                      title="Assign custom partner discounts for this member"
                                    >
                                      <Percent className="h-3 w-3 mr-1" />
                                      Discounts
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-[11px] h-7 px-2"
                                      onClick={() => {
                                        const newPhoto = window.prompt("Enter photo URL for " + u.full_name + ":", u.photo_url || "");
                                        if (newPhoto !== null) {
                                          updateUser(u.id, { photo_url: newPhoto.trim() || null })
                                            .then((updated) => {
                                              setUsers((prev) => prev.map((x) => (x.id === updated.id ? { ...x, photo_url: updated.photo_url } : x)));
                                              notify("Photo updated for " + u.full_name);
                                            })
                                            .catch((err) => notify(err.message, "error"));
                                        }
                                      }}
                                      title="Set member photo"
                                    >
                                      Photo
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-[11px] h-7 px-2"
                                      onClick={() => handleToggleUserStatus(u)}
                                    >
                                      {u.is_active ? "Deactivate" : "Activate"}
                                    </Button>
                                  </>
                                )}
                                {isAdmin && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-muted hover:text-red-400"
                                    onClick={() => handleDeleteUser(u.id)}
                                    title="Delete user"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}



          {/* SECTION 8: PARTNER CONVENTIONS (Admin & Manager) */}
          {currentSection === "partners" && canSeePartners && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-display text-2xl font-semibold flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-emerald-400" />
                    Partner Companies &amp; Conventions
                  </h3>
                  <p className="mt-1 text-xs text-muted max-w-xl">
                    Manage official partner agreements and conventions. To attribute custom discount rates to individual members, go to the <strong>Users</strong> tab and click <strong>Discounts</strong>.
                  </p>
                </div>

                {canManagePartners && (
                  <Button
                    size="sm"
                    onClick={() => setNewPartnerModalOpen(true)}
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add Partner Company
                  </Button>
                )}
              </div>

              {/* Partners Grid */}
              {partners.length === 0 ? (
                <div className="rounded-2xl border border-line bg-surface/40 p-12 text-center space-y-3">
                  <Building2 className="mx-auto h-12 w-12 text-muted/40" />
                  <p className="text-muted text-sm font-medium">No partner companies registered yet.</p>
                  <Button size="sm" onClick={() => setNewPartnerModalOpen(true)} className="text-xs">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Register First Partner
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {partners.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-2xl border border-line bg-surface/70 p-5 flex flex-col justify-between space-y-4 shadow-sm hover:border-emerald-500/40 transition-colors"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-14 w-14 rounded-xl bg-zinc-950 border border-zinc-800 p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                              <img src={p.logo_url} alt={p.name} className="h-full w-full object-contain" />
                            </div>
                            <div>
                              <h4 className="font-display font-semibold text-sm text-fg">{p.name}</h4>
                              <span className="text-[10px] text-muted font-mono uppercase tracking-wider block">
                                {p.category || "Convention"}
                              </span>
                            </div>
                          </div>

                          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-xs px-2.5 py-0.5">
                            {p.default_discount}
                          </span>
                        </div>

                        {p.description && (
                          <p className="text-xs text-muted leading-relaxed line-clamp-2">{p.description}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-line/60 text-xs">
                        {p.website ? (
                          <a
                            href={p.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-muted hover:text-emerald-400 flex items-center gap-1 font-mono"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {p.website.replace(/^https?:\/\//, "")}
                          </a>
                        ) : (
                          <span className="text-[11px] text-muted font-mono">Batna Convention</span>
                        )}

                        {isAdmin && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted hover:text-red-400"
                            onClick={() => handleDeletePartner(p.id)}
                            title="Delete partner company"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* MODAL 1: ASSIGN MEMBER PARTNER DISCOUNTS */}
          {/* ======================================================== */}
          {discountModalUser && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setDiscountModalUser(null)}
            >
              <div
                className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-2xl space-y-6"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setDiscountModalUser(null)}
                  className="absolute right-5 top-5 rounded-full p-1.5 text-muted hover:text-fg hover:bg-surface-2 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-4 pb-4 border-b border-line">
                  <div className="h-12 w-12 rounded-full bg-surface-2 border border-line flex items-center justify-center font-bold text-base overflow-hidden shrink-0">
                    {discountModalUser.photo_url ? (
                      <img src={discountModalUser.photo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      discountModalUser.full_name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-fg">
                      Assign Partner Discounts: {discountModalUser.full_name}
                    </h3>
                    <p className="text-xs text-muted font-mono">
                      Member #{discountModalUser.id} &bull; {discountModalUser.email} &bull; {discountModalUser.major || "Computer Science"}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-200 space-y-1">
                  <p className="font-semibold text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    Personalized Member Conventions
                  </p>
                  <p>
                    Set custom discounts for this specific member (e.g., 20% at Cyber Tech, 40% at The Hive). When they swipe up their digital card, these rates will appear on their squares.
                  </p>
                </div>

                {/* Partners List */}
                {memberDiscountsLoading ? (
                  <div className="py-12 text-center text-xs text-muted font-mono">
                    Loading member discounts…
                  </div>
                ) : memberDiscounts.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted">
                    No partner companies registered yet. Create partners in the "Partners" tab first.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {memberDiscounts.map((partner) => {
                      const hasAssigned = Boolean(partner.member_discount);
                      const currentVal = discountInputs[partner.id] || "";
                      const isSaving = savingDiscountId === partner.id;

                      return (
                        <div
                          key={partner.id}
                          className={`rounded-2xl border p-4 space-y-3 transition-colors ${
                            hasAssigned
                              ? "border-emerald-500/40 bg-emerald-950/20"
                              : "border-line bg-surface-2/40"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="h-11 w-11 rounded-xl bg-zinc-950 border border-zinc-800 p-1.5 flex items-center justify-center shrink-0">
                                <img src={partner.logo_url} alt="" className="h-full w-full object-contain" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-xs text-fg">{partner.name}</h4>
                                <span className="text-[10px] text-muted font-mono uppercase">
                                  {partner.category || "Convention"} &bull; Standard: {partner.default_discount}
                                </span>
                              </div>
                            </div>

                            <div>
                              {hasAssigned ? (
                                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs px-2.5 py-0.5">
                                  Current: {partner.member_discount}
                                </span>
                              ) : (
                                <span className="text-[11px] text-muted font-mono">
                                  Default ({partner.default_discount})
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Fast preset percentages */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] text-muted mr-1">Presets:</span>
                            {["15% OFF", "20% OFF", "25% OFF", "30% OFF", "40% OFF", "50% OFF"].map((rate) => (
                              <button
                                key={rate}
                                type="button"
                                onClick={() => setDiscountInputs((prev) => ({ ...prev, [partner.id]: rate }))}
                                className={`rounded-lg px-2 py-0.5 text-[10px] font-mono border transition-colors ${
                                  currentVal === rate
                                    ? "bg-emerald-500 text-black font-bold border-emerald-400"
                                    : "bg-surface border-line text-muted hover:text-fg hover:border-fg/40"
                                }`}
                              >
                                {rate}
                              </button>
                            ))}
                          </div>

                          {/* Custom Input + Save Button */}
                          <div className="flex items-center gap-2 pt-1">
                            <Input
                              value={currentVal}
                              onChange={(e) =>
                                setDiscountInputs((prev) => ({ ...prev, [partner.id]: e.target.value }))
                              }
                              placeholder="e.g. 20% OFF or 40% OFF"
                              className="text-xs h-8 max-w-[200px]"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSaveMemberDiscount(partner.id)}
                              disabled={isSaving}
                              className="text-xs h-8 bg-emerald-600 hover:bg-emerald-500 text-white"
                            >
                              {isSaving ? "Saving…" : "Save Discount"}
                            </Button>

                            {hasAssigned && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemoveMemberDiscount(partner.id)}
                                disabled={isSaving}
                                className="text-xs h-8 border-red-500/30 text-red-300 hover:bg-red-500/10"
                              >
                                Reset to Default
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button size="sm" onClick={() => setDiscountModalUser(null)} className="text-xs">
                    Done
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODAL 2: ADD NEW PARTNER COMPANY */}
          {/* ======================================================== */}
          {newPartnerModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setNewPartnerModalOpen(false)}
            >
              <div
                className="relative w-full max-w-lg rounded-3xl border border-line bg-surface p-6 sm:p-7 shadow-2xl space-y-5"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setNewPartnerModalOpen(false)}
                  className="absolute right-4 top-4 rounded-full p-1.5 text-muted hover:text-fg hover:bg-surface-2 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>

                <div>
                  <h3 className="font-display text-xl font-bold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-emerald-400" />
                    Register New Partner Company
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    Add a convention agreement. Members will see this partner in their card background grid.
                  </p>
                </div>

                <form onSubmit={handleCreatePartner} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Company Name</label>
                    <Input
                      required
                      placeholder="e.g. Batna Cyber Tech"
                      value={newPartner.name}
                      onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300">Category</label>
                      <Select
                        value={newPartner.category}
                        onChange={(e) => setNewPartner({ ...newPartner, category: e.target.value })}
                        className="text-xs h-9"
                      >
                        <option value="Tech & Hardware">Tech &amp; Hardware</option>
                        <option value="Printing & Academia">Printing &amp; Academia</option>
                        <option value="Languages & Testing">Languages &amp; Testing</option>
                        <option value="Coworking & Coffee">Coworking &amp; Coffee</option>
                        <option value="Textbooks & Supplies">Textbooks &amp; Supplies</option>
                        <option value="Fitness & Wellness">Fitness &amp; Wellness</option>
                        <option value="Other Convention">Other Convention</option>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300">Default Discount Rate</label>
                      <Input
                        required
                        placeholder="e.g. 20% OFF"
                        value={newPartner.default_discount}
                        onChange={(e) => setNewPartner({ ...newPartner, default_discount: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* Logo URL with quick-pick presets */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                      <span>Logo URL / Preset</span>
                      {newPartner.logo_url && (
                        <span className="text-[10px] text-emerald-400 font-mono">Preview Ready</span>
                      )}
                    </label>

                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-zinc-950 border border-zinc-800 p-2 flex items-center justify-center shrink-0">
                        {newPartner.logo_url ? (
                          <img src={newPartner.logo_url} alt="Preview" className="h-full w-full object-contain" />
                        ) : (
                          <Building2 className="h-5 w-5 text-zinc-600" />
                        )}
                      </div>
                      <Input
                        required
                        placeholder="https://... or /partners/cyber-tech.svg"
                        value={newPartner.logo_url}
                        onChange={(e) => setNewPartner({ ...newPartner, logo_url: e.target.value })}
                        className="text-xs"
                      />
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-muted mr-1">Presets:</span>
                      {[
                        { label: "Tech", path: "/partners/cyber-tech.svg" },
                        { label: "Printing", path: "/partners/el-amel-print.svg" },
                        { label: "Languages", path: "/partners/cambridge-lang.svg" },
                        { label: "Coworking", path: "/partners/the-hive.svg" },
                        { label: "Books", path: "/partners/librairie-univ.svg" },
                        { label: "Fitness", path: "/partners/olympia-fitness.svg" },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setNewPartner({ ...newPartner, logo_url: preset.path })}
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-mono border transition-colors ${
                            newPartner.logo_url === preset.path
                              ? "bg-emerald-500 text-black font-bold border-emerald-400"
                              : "bg-surface border-line text-muted hover:text-fg"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Website URL (Optional)</label>
                    <Input
                      placeholder="https://example.dz"
                      value={newPartner.website}
                      onChange={(e) => setNewPartner({ ...newPartner, website: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Convention Description (Optional)</label>
                    <Textarea
                      rows={2}
                      placeholder="Special conditions, perks, or instructions for members…"
                      value={newPartner.description}
                      onChange={(e) => setNewPartner({ ...newPartner, description: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewPartnerModalOpen(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={creatingPartner}
                      className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      {creatingPartner ? "Creating…" : "Save Partner"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* SECTION 6: ADD NEW USER (Admin only) */}
          {currentSection === "add_user" && canSeeAddUser && (
            <div className="mx-auto max-w-2xl space-y-6">
              <div className="rounded-2xl border border-line bg-surface/70 p-6 sm:p-8 space-y-6 shadow-sm">
                <div>
                  <h3 className="font-display text-2xl font-semibold flex items-center gap-2">
                    <UserPlus className="h-6 w-6" />
                    Add New User &amp; Assign Role
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    Create a new club account directly in the MySQL database and grant them their specific staff or member role.
                  </p>
                </div>

                {createUserError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs text-red-200"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                    <div>
                      <p className="font-semibold text-red-300">Error Creating User</p>
                      <p>{createUserError}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleCreateUser} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300 flex items-center gap-1">
                        <UserIcon className="h-3.5 w-3.5 text-muted" /> Full Name
                      </label>
                      <Input
                        required
                        placeholder="e.g. Sarah Mansouri"
                        value={newUser.full_name}
                        onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300 flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-muted" /> Email Address
                      </label>
                      <Input
                        required
                        type="email"
                        placeholder="user@lyceum.dz"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300 flex items-center gap-1">
                        <Lock className="h-3.5 w-3.5 text-muted" /> Password
                      </label>
                      <Input
                        required
                        type="password"
                        placeholder="At least 6 characters"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300 flex items-center gap-1">
                        <GraduationCap className="h-3.5 w-3.5 text-muted" /> Academic Major / Specialization
                      </label>
                      <Input
                        placeholder="e.g. Computer Science & AI, Architecture, etc."
                        value={newUser.major || ""}
                        onChange={(e) => setNewUser({ ...newUser, major: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* Role Picker */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-300 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-muted" /> Select Role &amp; Permissions
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {CLUB_ROLES.map((r) => {
                        const isSelected = newUser.role === r.id;
                        return (
                          <div
                            key={r.id}
                            onClick={() => setNewUser({ ...newUser, role: r.id })}
                            className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                              isSelected
                                ? "border-fg bg-surface-2 ring-1 ring-fg"
                                : "border-line bg-surface hover:border-fg/50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${r.badge}`}>
                                {r.label}
                              </span>
                              {isSelected && <CheckCircle2 className="h-4 w-4 text-fg" />}
                            </div>
                            <p className="mt-2 text-[11px] text-muted">{r.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="user-active"
                      checked={newUser.is_active}
                      onChange={(e) => setNewUser({ ...newUser, is_active: e.target.checked })}
                      className="rounded border-line bg-surface text-fg focus:ring-fg"
                    />
                    <label htmlFor="user-active" className="text-xs font-medium text-zinc-300 cursor-pointer">
                      Account is active and ready to log in immediately
                    </label>
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentSection("users")}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createUserLoading} className="text-xs">
                      {createUserLoading ? "Saving to MySQL…" : "Create User Account"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}



          {/* SECTION 8: PARTNER CONVENTIONS (Admin & Manager) */}
          {currentSection === "partners" && canSeePartners && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-display text-2xl font-semibold flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-emerald-400" />
                    Partner Companies &amp; Conventions
                  </h3>
                  <p className="mt-1 text-xs text-muted max-w-xl">
                    Manage official partner agreements and conventions. To attribute custom discount rates to individual members, go to the <strong>Users</strong> tab and click <strong>Discounts</strong>.
                  </p>
                </div>

                {canManagePartners && (
                  <Button
                    size="sm"
                    onClick={() => setNewPartnerModalOpen(true)}
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add Partner Company
                  </Button>
                )}
              </div>

              {/* Partners Grid */}
              {partners.length === 0 ? (
                <div className="rounded-2xl border border-line bg-surface/40 p-12 text-center space-y-3">
                  <Building2 className="mx-auto h-12 w-12 text-muted/40" />
                  <p className="text-muted text-sm font-medium">No partner companies registered yet.</p>
                  <Button size="sm" onClick={() => setNewPartnerModalOpen(true)} className="text-xs">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Register First Partner
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {partners.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-2xl border border-line bg-surface/70 p-5 flex flex-col justify-between space-y-4 shadow-sm hover:border-emerald-500/40 transition-colors"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-14 w-14 rounded-xl bg-zinc-950 border border-zinc-800 p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                              <img src={p.logo_url} alt={p.name} className="h-full w-full object-contain" />
                            </div>
                            <div>
                              <h4 className="font-display font-semibold text-sm text-fg">{p.name}</h4>
                              <span className="text-[10px] text-muted font-mono uppercase tracking-wider block">
                                {p.category || "Convention"}
                              </span>
                            </div>
                          </div>

                          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-xs px-2.5 py-0.5">
                            {p.default_discount}
                          </span>
                        </div>

                        {p.description && (
                          <p className="text-xs text-muted leading-relaxed line-clamp-2">{p.description}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-line/60 text-xs">
                        {p.website ? (
                          <a
                            href={p.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-muted hover:text-emerald-400 flex items-center gap-1 font-mono"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {p.website.replace(/^https?:\/\//, "")}
                          </a>
                        ) : (
                          <span className="text-[11px] text-muted font-mono">Batna Convention</span>
                        )}

                        {isAdmin && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted hover:text-red-400"
                            onClick={() => handleDeletePartner(p.id)}
                            title="Delete partner company"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* MODAL 1: ASSIGN MEMBER PARTNER DISCOUNTS */}
          {/* ======================================================== */}
          {discountModalUser && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setDiscountModalUser(null)}
            >
              <div
                className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-2xl space-y-6"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setDiscountModalUser(null)}
                  className="absolute right-5 top-5 rounded-full p-1.5 text-muted hover:text-fg hover:bg-surface-2 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-4 pb-4 border-b border-line">
                  <div className="h-12 w-12 rounded-full bg-surface-2 border border-line flex items-center justify-center font-bold text-base overflow-hidden shrink-0">
                    {discountModalUser.photo_url ? (
                      <img src={discountModalUser.photo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      discountModalUser.full_name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-fg">
                      Assign Partner Discounts: {discountModalUser.full_name}
                    </h3>
                    <p className="text-xs text-muted font-mono">
                      Member #{discountModalUser.id} &bull; {discountModalUser.email} &bull; {discountModalUser.major || "Computer Science"}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-200 space-y-1">
                  <p className="font-semibold text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    Personalized Member Conventions
                  </p>
                  <p>
                    Set custom discounts for this specific member (e.g., 20% at Cyber Tech, 40% at The Hive). When they swipe up their digital card, these rates will appear on their squares.
                  </p>
                </div>

                {/* Partners List */}
                {memberDiscountsLoading ? (
                  <div className="py-12 text-center text-xs text-muted font-mono">
                    Loading member discounts…
                  </div>
                ) : memberDiscounts.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted">
                    No partner companies registered yet. Create partners in the "Partners" tab first.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {memberDiscounts.map((partner) => {
                      const hasAssigned = Boolean(partner.member_discount);
                      const currentVal = discountInputs[partner.id] || "";
                      const isSaving = savingDiscountId === partner.id;

                      return (
                        <div
                          key={partner.id}
                          className={`rounded-2xl border p-4 space-y-3 transition-colors ${
                            hasAssigned
                              ? "border-emerald-500/40 bg-emerald-950/20"
                              : "border-line bg-surface-2/40"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="h-11 w-11 rounded-xl bg-zinc-950 border border-zinc-800 p-1.5 flex items-center justify-center shrink-0">
                                <img src={partner.logo_url} alt="" className="h-full w-full object-contain" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-xs text-fg">{partner.name}</h4>
                                <span className="text-[10px] text-muted font-mono uppercase">
                                  {partner.category || "Convention"} &bull; Standard: {partner.default_discount}
                                </span>
                              </div>
                            </div>

                            <div>
                              {hasAssigned ? (
                                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs px-2.5 py-0.5">
                                  Current: {partner.member_discount}
                                </span>
                              ) : (
                                <span className="text-[11px] text-muted font-mono">
                                  Default ({partner.default_discount})
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Fast preset percentages */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] text-muted mr-1">Presets:</span>
                            {["15% OFF", "20% OFF", "25% OFF", "30% OFF", "40% OFF", "50% OFF"].map((rate) => (
                              <button
                                key={rate}
                                type="button"
                                onClick={() => setDiscountInputs((prev) => ({ ...prev, [partner.id]: rate }))}
                                className={`rounded-lg px-2 py-0.5 text-[10px] font-mono border transition-colors ${
                                  currentVal === rate
                                    ? "bg-emerald-500 text-black font-bold border-emerald-400"
                                    : "bg-surface border-line text-muted hover:text-fg hover:border-fg/40"
                                }`}
                              >
                                {rate}
                              </button>
                            ))}
                          </div>

                          {/* Custom Input + Save Button */}
                          <div className="flex items-center gap-2 pt-1">
                            <Input
                              value={currentVal}
                              onChange={(e) =>
                                setDiscountInputs((prev) => ({ ...prev, [partner.id]: e.target.value }))
                              }
                              placeholder="e.g. 20% OFF or 40% OFF"
                              className="text-xs h-8 max-w-[200px]"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSaveMemberDiscount(partner.id)}
                              disabled={isSaving}
                              className="text-xs h-8 bg-emerald-600 hover:bg-emerald-500 text-white"
                            >
                              {isSaving ? "Saving…" : "Save Discount"}
                            </Button>

                            {hasAssigned && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemoveMemberDiscount(partner.id)}
                                disabled={isSaving}
                                className="text-xs h-8 border-red-500/30 text-red-300 hover:bg-red-500/10"
                              >
                                Reset to Default
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button size="sm" onClick={() => setDiscountModalUser(null)} className="text-xs">
                    Done
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODAL 2: ADD NEW PARTNER COMPANY */}
          {/* ======================================================== */}
          {newPartnerModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setNewPartnerModalOpen(false)}
            >
              <div
                className="relative w-full max-w-lg rounded-3xl border border-line bg-surface p-6 sm:p-7 shadow-2xl space-y-5"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setNewPartnerModalOpen(false)}
                  className="absolute right-4 top-4 rounded-full p-1.5 text-muted hover:text-fg hover:bg-surface-2 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>

                <div>
                  <h3 className="font-display text-xl font-bold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-emerald-400" />
                    Register New Partner Company
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    Add a convention agreement. Members will see this partner in their card background grid.
                  </p>
                </div>

                <form onSubmit={handleCreatePartner} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Company Name</label>
                    <Input
                      required
                      placeholder="e.g. Batna Cyber Tech"
                      value={newPartner.name}
                      onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300">Category</label>
                      <Select
                        value={newPartner.category}
                        onChange={(e) => setNewPartner({ ...newPartner, category: e.target.value })}
                        className="text-xs h-9"
                      >
                        <option value="Tech & Hardware">Tech &amp; Hardware</option>
                        <option value="Printing & Academia">Printing &amp; Academia</option>
                        <option value="Languages & Testing">Languages &amp; Testing</option>
                        <option value="Coworking & Coffee">Coworking &amp; Coffee</option>
                        <option value="Textbooks & Supplies">Textbooks &amp; Supplies</option>
                        <option value="Fitness & Wellness">Fitness &amp; Wellness</option>
                        <option value="Other Convention">Other Convention</option>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300">Default Discount Rate</label>
                      <Input
                        required
                        placeholder="e.g. 20% OFF"
                        value={newPartner.default_discount}
                        onChange={(e) => setNewPartner({ ...newPartner, default_discount: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* Logo URL with quick-pick presets */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                      <span>Logo URL / Preset</span>
                      {newPartner.logo_url && (
                        <span className="text-[10px] text-emerald-400 font-mono">Preview Ready</span>
                      )}
                    </label>

                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-zinc-950 border border-zinc-800 p-2 flex items-center justify-center shrink-0">
                        {newPartner.logo_url ? (
                          <img src={newPartner.logo_url} alt="Preview" className="h-full w-full object-contain" />
                        ) : (
                          <Building2 className="h-5 w-5 text-zinc-600" />
                        )}
                      </div>
                      <Input
                        required
                        placeholder="https://... or /partners/cyber-tech.svg"
                        value={newPartner.logo_url}
                        onChange={(e) => setNewPartner({ ...newPartner, logo_url: e.target.value })}
                        className="text-xs"
                      />
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-muted mr-1">Presets:</span>
                      {[
                        { label: "Tech", path: "/partners/cyber-tech.svg" },
                        { label: "Printing", path: "/partners/el-amel-print.svg" },
                        { label: "Languages", path: "/partners/cambridge-lang.svg" },
                        { label: "Coworking", path: "/partners/the-hive.svg" },
                        { label: "Books", path: "/partners/librairie-univ.svg" },
                        { label: "Fitness", path: "/partners/olympia-fitness.svg" },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setNewPartner({ ...newPartner, logo_url: preset.path })}
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-mono border transition-colors ${
                            newPartner.logo_url === preset.path
                              ? "bg-emerald-500 text-black font-bold border-emerald-400"
                              : "bg-surface border-line text-muted hover:text-fg"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Website URL (Optional)</label>
                    <Input
                      placeholder="https://example.dz"
                      value={newPartner.website}
                      onChange={(e) => setNewPartner({ ...newPartner, website: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Convention Description (Optional)</label>
                    <Textarea
                      rows={2}
                      placeholder="Special conditions, perks, or instructions for members…"
                      value={newPartner.description}
                      onChange={(e) => setNewPartner({ ...newPartner, description: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewPartnerModalOpen(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={creatingPartner}
                      className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      {creatingPartner ? "Creating…" : "Save Partner"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* SECTION 7: ROLES GUIDE (Admin only) */}
          {currentSection === "roles" && canSeeRolesGuide && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h3 className="font-display text-2xl font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-6 w-6" />
                  Lyceum Club Roles &amp; Responsibilities Guide
                </h3>
                <p className="mt-1 text-xs text-muted">
                  Overview of privileges and scopes defined for each club member and administration rank.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {CLUB_ROLES.map((roleDef) => (
                  <div key={roleDef.id} className="rounded-2xl border border-line bg-surface/70 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${roleDef.badge}`}>
                        {roleDef.label}
                      </span>
                      <span className="text-xs font-mono text-muted">role: '{roleDef.id}'</span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">{roleDef.description}</p>

                    <div className="border-t border-line/60 pt-3 text-[11px] space-y-1">
                      <p className="font-semibold text-fg">Key Capabilities:</p>
                      <p className="flex items-center gap-1.5 text-muted">
                        {roleDef.canReviewHr ? (
                          <span className="text-green-400">✓ Stage 1 HR Review (Approve/Reject)</span>
                        ) : (
                          <span className="text-zinc-500">✗ Stage 1 HR Review</span>
                        )}
                      </p>
                      <p className="flex items-center gap-1.5 text-muted">
                        {roleDef.canReviewPresident ? (
                          <span className="text-green-400">✓ Stage 2 President Final Decisions</span>
                        ) : (
                          <span className="text-zinc-500">✗ Stage 2 President Final Decisions</span>
                        )}
                      </p>
                      <p className="flex items-center gap-1.5 text-muted">
                        {roleDef.canManageUsers ? (
                          <span className="text-green-400">✓ User Account Creation &amp; Role Management</span>
                        ) : (
                          <span className="text-zinc-500">✗ User Account Creation &amp; Role Management</span>
                        )}
                      </p>
                      <p className="flex items-center gap-1.5 text-muted">
                        {roleDef.canManageMembers ? (
                          <span className="text-green-400">✓ Access to Members Roster</span>
                        ) : (
                          <span className="text-zinc-500">✗ Access to Members Roster</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 8: PARTNER CONVENTIONS (Admin & Manager) */}
          {currentSection === "partners" && canSeePartners && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-display text-2xl font-semibold flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-emerald-400" />
                    Partner Companies &amp; Conventions
                  </h3>
                  <p className="mt-1 text-xs text-muted max-w-xl">
                    Manage official partner agreements and conventions. To attribute custom discount rates to individual members, go to the <strong>Users</strong> tab and click <strong>Discounts</strong>.
                  </p>
                </div>

                {canManagePartners && (
                  <Button
                    size="sm"
                    onClick={() => setNewPartnerModalOpen(true)}
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add Partner Company
                  </Button>
                )}
              </div>

              {/* Partners Grid */}
              {partners.length === 0 ? (
                <div className="rounded-2xl border border-line bg-surface/40 p-12 text-center space-y-3">
                  <Building2 className="mx-auto h-12 w-12 text-muted/40" />
                  <p className="text-muted text-sm font-medium">No partner companies registered yet.</p>
                  <Button size="sm" onClick={() => setNewPartnerModalOpen(true)} className="text-xs">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Register First Partner
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {partners.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-2xl border border-line bg-surface/70 p-5 flex flex-col justify-between space-y-4 shadow-sm hover:border-emerald-500/40 transition-colors"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-14 w-14 rounded-xl bg-zinc-950 border border-zinc-800 p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                              <img src={p.logo_url} alt={p.name} className="h-full w-full object-contain" />
                            </div>
                            <div>
                              <h4 className="font-display font-semibold text-sm text-fg">{p.name}</h4>
                              <span className="text-[10px] text-muted font-mono uppercase tracking-wider block">
                                {p.category || "Convention"}
                              </span>
                            </div>
                          </div>

                          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-xs px-2.5 py-0.5">
                            {p.default_discount}
                          </span>
                        </div>

                        {p.description && (
                          <p className="text-xs text-muted leading-relaxed line-clamp-2">{p.description}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-line/60 text-xs">
                        {p.website ? (
                          <a
                            href={p.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-muted hover:text-emerald-400 flex items-center gap-1 font-mono"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {p.website.replace(/^https?:\/\//, "")}
                          </a>
                        ) : (
                          <span className="text-[11px] text-muted font-mono">Batna Convention</span>
                        )}

                        {isAdmin && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted hover:text-red-400"
                            onClick={() => handleDeletePartner(p.id)}
                            title="Delete partner company"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* MODAL 1: ASSIGN MEMBER PARTNER DISCOUNTS */}
          {/* ======================================================== */}
          {discountModalUser && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setDiscountModalUser(null)}
            >
              <div
                className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-2xl space-y-6"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setDiscountModalUser(null)}
                  className="absolute right-5 top-5 rounded-full p-1.5 text-muted hover:text-fg hover:bg-surface-2 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-4 pb-4 border-b border-line">
                  <div className="h-12 w-12 rounded-full bg-surface-2 border border-line flex items-center justify-center font-bold text-base overflow-hidden shrink-0">
                    {discountModalUser.photo_url ? (
                      <img src={discountModalUser.photo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      discountModalUser.full_name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-fg">
                      Assign Partner Discounts: {discountModalUser.full_name}
                    </h3>
                    <p className="text-xs text-muted font-mono">
                      Member #{discountModalUser.id} &bull; {discountModalUser.email} &bull; {discountModalUser.major || "Computer Science"}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-200 space-y-1">
                  <p className="font-semibold text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    Personalized Member Conventions
                  </p>
                  <p>
                    Set custom discounts for this specific member (e.g., 20% at Cyber Tech, 40% at The Hive). When they swipe up their digital card, these rates will appear on their squares.
                  </p>
                </div>

                {/* Partners List */}
                {memberDiscountsLoading ? (
                  <div className="py-12 text-center text-xs text-muted font-mono">
                    Loading member discounts…
                  </div>
                ) : memberDiscounts.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted">
                    No partner companies registered yet. Create partners in the "Partners" tab first.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {memberDiscounts.map((partner) => {
                      const hasAssigned = Boolean(partner.member_discount);
                      const currentVal = discountInputs[partner.id] || "";
                      const isSaving = savingDiscountId === partner.id;

                      return (
                        <div
                          key={partner.id}
                          className={`rounded-2xl border p-4 space-y-3 transition-colors ${
                            hasAssigned
                              ? "border-emerald-500/40 bg-emerald-950/20"
                              : "border-line bg-surface-2/40"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="h-11 w-11 rounded-xl bg-zinc-950 border border-zinc-800 p-1.5 flex items-center justify-center shrink-0">
                                <img src={partner.logo_url} alt="" className="h-full w-full object-contain" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-xs text-fg">{partner.name}</h4>
                                <span className="text-[10px] text-muted font-mono uppercase">
                                  {partner.category || "Convention"} &bull; Standard: {partner.default_discount}
                                </span>
                              </div>
                            </div>

                            <div>
                              {hasAssigned ? (
                                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs px-2.5 py-0.5">
                                  Current: {partner.member_discount}
                                </span>
                              ) : (
                                <span className="text-[11px] text-muted font-mono">
                                  Default ({partner.default_discount})
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Fast preset percentages */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] text-muted mr-1">Presets:</span>
                            {["15% OFF", "20% OFF", "25% OFF", "30% OFF", "40% OFF", "50% OFF"].map((rate) => (
                              <button
                                key={rate}
                                type="button"
                                onClick={() => setDiscountInputs((prev) => ({ ...prev, [partner.id]: rate }))}
                                className={`rounded-lg px-2 py-0.5 text-[10px] font-mono border transition-colors ${
                                  currentVal === rate
                                    ? "bg-emerald-500 text-black font-bold border-emerald-400"
                                    : "bg-surface border-line text-muted hover:text-fg hover:border-fg/40"
                                }`}
                              >
                                {rate}
                              </button>
                            ))}
                          </div>

                          {/* Custom Input + Save Button */}
                          <div className="flex items-center gap-2 pt-1">
                            <Input
                              value={currentVal}
                              onChange={(e) =>
                                setDiscountInputs((prev) => ({ ...prev, [partner.id]: e.target.value }))
                              }
                              placeholder="e.g. 20% OFF or 40% OFF"
                              className="text-xs h-8 max-w-[200px]"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSaveMemberDiscount(partner.id)}
                              disabled={isSaving}
                              className="text-xs h-8 bg-emerald-600 hover:bg-emerald-500 text-white"
                            >
                              {isSaving ? "Saving…" : "Save Discount"}
                            </Button>

                            {hasAssigned && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemoveMemberDiscount(partner.id)}
                                disabled={isSaving}
                                className="text-xs h-8 border-red-500/30 text-red-300 hover:bg-red-500/10"
                              >
                                Reset to Default
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button size="sm" onClick={() => setDiscountModalUser(null)} className="text-xs">
                    Done
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODAL 2: ADD NEW PARTNER COMPANY */}
          {/* ======================================================== */}
          {newPartnerModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setNewPartnerModalOpen(false)}
            >
              <div
                className="relative w-full max-w-lg rounded-3xl border border-line bg-surface p-6 sm:p-7 shadow-2xl space-y-5"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setNewPartnerModalOpen(false)}
                  className="absolute right-4 top-4 rounded-full p-1.5 text-muted hover:text-fg hover:bg-surface-2 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>

                <div>
                  <h3 className="font-display text-xl font-bold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-emerald-400" />
                    Register New Partner Company
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    Add a convention agreement. Members will see this partner in their card background grid.
                  </p>
                </div>

                <form onSubmit={handleCreatePartner} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Company Name</label>
                    <Input
                      required
                      placeholder="e.g. Batna Cyber Tech"
                      value={newPartner.name}
                      onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300">Category</label>
                      <Select
                        value={newPartner.category}
                        onChange={(e) => setNewPartner({ ...newPartner, category: e.target.value })}
                        className="text-xs h-9"
                      >
                        <option value="Tech & Hardware">Tech &amp; Hardware</option>
                        <option value="Printing & Academia">Printing &amp; Academia</option>
                        <option value="Languages & Testing">Languages &amp; Testing</option>
                        <option value="Coworking & Coffee">Coworking &amp; Coffee</option>
                        <option value="Textbooks & Supplies">Textbooks &amp; Supplies</option>
                        <option value="Fitness & Wellness">Fitness &amp; Wellness</option>
                        <option value="Other Convention">Other Convention</option>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300">Default Discount Rate</label>
                      <Input
                        required
                        placeholder="e.g. 20% OFF"
                        value={newPartner.default_discount}
                        onChange={(e) => setNewPartner({ ...newPartner, default_discount: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* Logo URL with quick-pick presets */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                      <span>Logo URL / Preset</span>
                      {newPartner.logo_url && (
                        <span className="text-[10px] text-emerald-400 font-mono">Preview Ready</span>
                      )}
                    </label>

                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-zinc-950 border border-zinc-800 p-2 flex items-center justify-center shrink-0">
                        {newPartner.logo_url ? (
                          <img src={newPartner.logo_url} alt="Preview" className="h-full w-full object-contain" />
                        ) : (
                          <Building2 className="h-5 w-5 text-zinc-600" />
                        )}
                      </div>
                      <Input
                        required
                        placeholder="https://... or /partners/cyber-tech.svg"
                        value={newPartner.logo_url}
                        onChange={(e) => setNewPartner({ ...newPartner, logo_url: e.target.value })}
                        className="text-xs"
                      />
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-muted mr-1">Presets:</span>
                      {[
                        { label: "Tech", path: "/partners/cyber-tech.svg" },
                        { label: "Printing", path: "/partners/el-amel-print.svg" },
                        { label: "Languages", path: "/partners/cambridge-lang.svg" },
                        { label: "Coworking", path: "/partners/the-hive.svg" },
                        { label: "Books", path: "/partners/librairie-univ.svg" },
                        { label: "Fitness", path: "/partners/olympia-fitness.svg" },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setNewPartner({ ...newPartner, logo_url: preset.path })}
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-mono border transition-colors ${
                            newPartner.logo_url === preset.path
                              ? "bg-emerald-500 text-black font-bold border-emerald-400"
                              : "bg-surface border-line text-muted hover:text-fg"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Website URL (Optional)</label>
                    <Input
                      placeholder="https://example.dz"
                      value={newPartner.website}
                      onChange={(e) => setNewPartner({ ...newPartner, website: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Convention Description (Optional)</label>
                    <Textarea
                      rows={2}
                      placeholder="Special conditions, perks, or instructions for members…"
                      value={newPartner.description}
                      onChange={(e) => setNewPartner({ ...newPartner, description: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewPartnerModalOpen(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={creatingPartner}
                      className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      {creatingPartner ? "Creating…" : "Save Partner"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
