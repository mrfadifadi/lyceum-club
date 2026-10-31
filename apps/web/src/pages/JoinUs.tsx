import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GridBackdrop } from "@/components/shared/GridBackdrop";
import { Logo } from "@/components/shared/Logo";
import { LoginForm } from "@/components/join/LoginForm";
import { SignupWizard } from "@/components/join/SignupWizard";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export default function JoinUs() {
  const [tab, setTab] = useState("login");
  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden bg-bg">
      <GridBackdrop />
      <header className="relative flex items-center justify-between border-b border-line/80 px-5 py-4 sm:px-8">
        <a href={routes.home} className="flex items-center gap-3 text-sm text-muted hover:text-fg"><ArrowLeft className="h-4 w-4" aria-hidden />Back to website</a>
        <Logo className="h-9" />
      </header>

      <div className="relative grid flex-1 place-items-center px-4 py-10">
        <div className={cn("hero-in w-full rounded-2xl border border-line bg-surface/70 p-6 shadow-[var(--shadow-card)] backdrop-blur transition-[max-width] duration-500 ease-out sm:p-8", tab === "signup" ? "max-w-2xl" : "max-w-md")} style={{ ["--d" as string]: ".3s" }}>
          <h1 className="font-display text-3xl font-semibold">Join Lyceum Club</h1>
          <p className="mt-1 text-sm text-muted">Log in to your account or register to join Lyceum Club.</p>

          <Tabs value={tab} onValueChange={setTab} className="mt-6">
            <TabsList><TabsTrigger value="login">Log In</TabsTrigger><TabsTrigger value="signup">Sign Up</TabsTrigger></TabsList>
            <div className="tab-shell mt-6">
              <TabsContent value="login" forceMount className="tab-panel"><LoginForm /></TabsContent>
              <TabsContent value="signup" forceMount className="tab-panel"><SignupWizard /></TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
