import { useState, useEffect, type FormEvent } from "react";
import { Lock, Mail, AlertCircle, Loader2, UserCheck, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthField } from "@/components/shared/AuthField";
import { validateLogin, type Errors } from "@/lib/validation";
import { loginUser } from "@/services/api";
import { saveAuthSession, clearAuthSession, getAuthUser, isAuthenticated, type AuthUser } from "@/lib/auth";
import { routes } from "@/lib/routes";

export function LoginForm() {
  const [v, setV] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      const u = getAuthUser();
      // If user has a staff role (admin, president, hr, manager), redirect directly to admin panel
      if (u && u.role !== "member") {
        window.location.href = routes.admin;
        return;
      }
      // If regular member, redirect directly to their member card page
      if (u && u.role === "member") {
        window.location.href = routes.member;
        return;
      }
      setUser(u);
    }
  }, []);

  const f = (k: "email" | "password") => ({
    name: k,
    value: v[k],
    error: errors[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setV((x) => ({ ...x, [k]: e.target.value }));
      setApiError(null);
      setErrors((x) => {
        const { [k]: _, ...rest } = x;
        return rest;
      });
    },
  });

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError(null);
    const errs = validateLogin(v);
    setErrors(errs);
    if (Object.keys(errs).length) {
      (e.currentTarget.querySelector('[aria-invalid="true"]') as HTMLElement | null)?.focus();
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser({ email: v.email, password: v.password });
      saveAuthSession(result);

      // Immediately redirect staff roles to the admin dashboard
      if (result.user.role !== "member") {
        window.location.href = routes.admin;
        return;
      }

      // Immediately redirect regular members to their dedicated card interface
      window.location.href = routes.member;
      return;
    } catch (err: any) {
      setApiError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    setV({ email: "", password: "" });
    setApiError(null);
  };

  // If already logged in as a regular member
  if (user) {
    return (
      <div className="step-in space-y-6 py-4 text-center" role="status">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 border border-line">
          <UserCheck className="h-7 w-7 text-fg" aria-hidden />
        </div>

        <div>
          <span className="inline-block rounded-full bg-surface px-3 py-1 text-xs uppercase tracking-wider font-semibold border border-line text-fg">
            Club Member
          </span>
          <h2 className="font-display mt-3 text-2xl font-semibold">
            Welcome back, {user.full_name}!
          </h2>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Button asChild className="w-full sm:w-auto">
            <a href={routes.home}>Go to Website</a>
          </Button>
          <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
            <LogOut className="h-4 w-4 mr-1.5" />
            Log out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={submit} className="space-y-5">
      {apiError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs text-red-200"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden />
          <div className="space-y-0.5">
            <p className="font-semibold text-red-300">Authentication Error</p>
            <p>{apiError}</p>
          </div>
        </div>
      )}

      <AuthField
        id="login-email"
        label="Email"
        icon={Mail}
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        disabled={loading}
        {...f("email")}
      />

      <AuthField
        id="login-password"
        label="Password"
        icon={Lock}
        password
        autoComplete="current-password"
        placeholder="••••••••"
        disabled={loading}
        {...f("password")}
      />

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          "Log in"
        )}
      </Button>
    </form>
  );
}
