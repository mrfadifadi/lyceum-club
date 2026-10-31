import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, Mail, Phone, User, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AuthField } from "@/components/shared/AuthField";
import { academicSystems, lmdLevels, lmdStatuses, universities, specializations, type UniversityId } from "@/data/academic";
import { MIN_WORDS, countWords, validateCv, validateStep1, validateStep2, validateStep3, type Errors, type SignupValues } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { submitApplication } from "@/services/api";
import { Field, FieldError, describedBy } from "./Field";
import { FileDropzone } from "./FileDropzone";
import { Stepper } from "./Stepper";
import { TagInput } from "./TagInput";

const STEPS = ["Personal information", "Academic information", "About you"];
const TITLES = ["Personal information", "Academic information", "Tell us about yourself"];
const initial: SignupValues = { firstName: "", lastName: "", email: "", phone: "", password: "", confirm: "", university: "", major: "", system: "", level: "", status: "", year: "", motivation: "", technical: [], languages: [], interests: [], cv: null };
type TextKey = { [K in keyof SignupValues]: SignupValues[K] extends string ? K : never }[keyof SignupValues];

function RadioCard({ name, value, checked, invalid, label, hint, onChange }: { name: string; value: string; checked: boolean; invalid: boolean; label: string; hint?: string; onChange: () => void }) {
  return (
    <label className={cn("relative flex cursor-pointer flex-col gap-1 rounded-xl border p-4 transition-colors has-[:checked]:border-fg has-[:checked]:bg-surface-2 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-fg/25", invalid ? "border-fg/60" : "border-line hover:border-fg/50")}>
      <input type="radio" name={name} value={value} checked={checked} aria-invalid={invalid} className="sr-only" onChange={onChange} />
      <span className="text-sm font-medium">{label}</span>{hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

/** 3-step sign-up. All answers live in one state object, so Back/Next never loses data. Front-end only. */
export function SignupWizard() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [v, setV] = useState<SignupValues>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedAppId, setSubmittedAppId] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);

  const clear = (...keys: string[]) => setErrors((e) => { const n = { ...e }; keys.forEach((k) => delete n[k]); return n; });
  const set = <K extends keyof SignupValues>(k: K, val: SignupValues[K]) => { setV((x) => ({ ...x, [k]: val })); clear(k); };
  const f = (k: TextKey) => ({ name: k, value: v[k], error: errors[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value) });

  useEffect(() => { if (tick) (formRef.current?.querySelector('[aria-invalid="true"]') as HTMLElement | null)?.focus(); }, [tick]);
  useEffect(() => { if (mounted.current) headingRef.current?.focus(); mounted.current = true; }, [step]);

  const go = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const errs = step === 0 ? validateStep1(v) : step === 1 ? validateStep2(v) : validateStep3(v);
    setErrors(errs);
    if (Object.keys(errs).length) return setTick((t) => t + 1);

    if (step < 2) {
      setDir(1);
      setStep(step + 1);
    } else {
      setSubmitting(true);
      try {
        const res = await submitApplication(v);
        setSubmittedAppId(res.id || null);
        setDone(true);
      } catch (err: any) {
        setSubmitError(err.message || "Failed to submit application to database.");
      } finally {
        setSubmitting(false);
      }
    }
  };
  const back = () => { setDir(-1); setErrors({}); setSubmitError(null); setStep(step - 1); };

  if (done) return (
    <div role="status" className="step-in space-y-4 py-4 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-green-400" aria-hidden />
      <h2 className="font-display text-2xl font-semibold">Application Submitted to HR</h2>
      <div className="mx-auto max-w-md rounded-xl border border-line bg-surface/60 p-4 text-xs text-left space-y-2">
        <p className="font-medium text-fg flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          Successfully saved in MySQL database
        </p>
        <p className="text-muted">
          Your application {submittedAppId ? `(#${submittedAppId})` : ""} has been forwarded to the <strong>HR Department</strong> for review.
        </p>
        <p className="text-muted">
          Approval Process: HR reviews your profile &rarr; Forwarded to the President &rarr; Final decision notification.
        </p>
      </div>
      <Button variant="outline" onClick={() => { setDone(false); setDir(-1); setStep(0); setV(initial); }}>Submit another application</Button>
    </div>
  );

  const system = academicSystems.find((s) => s.id === v.system);
  const level = lmdLevels.find((l) => l.id === v.level);
  const isLmd = v.system === "lmd";
  const yearOptions: readonly string[] = isLmd ? level?.years ?? [] : system?.years ?? [];
  const showYear = isLmd ? v.status === "studying" : true;
  const words = countWords(v.motivation);

  return (
    <form ref={formRef} noValidate onSubmit={go} className="space-y-7">
      <Stepper steps={STEPS} current={step} />
      <div key={step} className="step-in space-y-5" style={{ ["--dir" as string]: dir }}>
        <h2 ref={headingRef} tabIndex={-1} className="font-display text-xl font-semibold outline-none">
          <span className="text-muted">Step {step + 1} of 3 · </span>{TITLES[step]}
        </h2>

        {step === 0 && (<>
          <div className="grid gap-5 sm:grid-cols-2">
            <AuthField id="su-firstName" label="First name" icon={User} autoComplete="given-name" {...f("firstName")} />
            <AuthField id="su-lastName" label="Last name" icon={User} autoComplete="family-name" {...f("lastName")} />
          </div>
          <AuthField id="su-email" label="Email" icon={Mail} type="email" autoComplete="email" placeholder="you@example.com" {...f("email")} />
          <AuthField id="su-phone" label="Phone number" icon={Phone} type="tel" inputMode="tel" autoComplete="tel" placeholder="+213 5XX XX XX XX" {...f("phone")} />
          <div className="grid gap-5 sm:grid-cols-2">
            <AuthField id="su-password" label="Password" icon={Lock} password autoComplete="new-password" placeholder="At least 8 characters" {...f("password")} />
            <AuthField id="su-confirm" label="Enter password again" icon={Lock} password autoComplete="new-password" placeholder="Repeat your password" {...f("confirm")} />
          </div>
        </>)}

        {step === 1 && (<>
          <Field id="su-university" label="University" error={errors.university}>
            <Select id="su-university" value={v.university} aria-invalid={!!errors.university}
              aria-describedby={describedBy("su-university", false, errors.university)}
              onChange={(e) => { setV((x) => ({ ...x, university: e.target.value as UniversityId | "", major: "" })); clear("university", "major"); }}>
              <option value="">Select…</option>
              {universities.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
            </Select>
          </Field>
          <Field id="su-major" label="Specialization" error={errors.major}
            hint={!v.university ? "Select your university first." : undefined}>
            <Select id="su-major" value={v.major} disabled={!v.university} aria-invalid={!!errors.major}
              aria-describedby={describedBy("su-major", !v.university, errors.major)}
              onChange={(e) => set("major", e.target.value)}>
              <option value="">{v.university ? "Select…" : "Select your university first"}</option>
              {v.university ? (specializations[v.university as UniversityId] ?? []).map((s) => (
                <option key={s} value={s}>{s}</option>
              )) : null}
            </Select>
          </Field>
          <fieldset className="grid gap-2" aria-describedby={errors.system ? "su-system-error" : undefined}>
            <legend className="mb-2 text-sm font-medium text-zinc-300">Academic system</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {academicSystems.map((s) => (
                <RadioCard key={s.id} name="system" value={s.id} checked={v.system === s.id} invalid={!!errors.system} label={s.label} hint={s.hint}
                  onChange={() => { setV((x) => ({ ...x, system: s.id, level: "", status: "", year: "" })); clear("system", "level", "status", "year"); }} />
              ))}
            </div>
            <FieldError id="su-system-error" message={errors.system} />
          </fieldset>

          {isLmd && (<div className="step-in space-y-5">
            <Field id="su-level" label="Level" error={errors.level}>
              <Select id="su-level" value={v.level} aria-invalid={!!errors.level} aria-describedby={describedBy("su-level", false, errors.level)}
                onChange={(e) => { setV((x) => ({ ...x, level: e.target.value, year: "" })); clear("level", "year"); }}>
                <option value="">Select…</option>
                {lmdLevels.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
              </Select>
            </Field>
            <fieldset className="grid gap-2" aria-describedby={errors.status ? "su-status-error" : undefined}>
              <legend className="mb-2 text-sm font-medium text-zinc-300">Have you graduated?</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {lmdStatuses.map((s) => (
                  <RadioCard key={s.id} name="status" value={s.id} checked={v.status === s.id} invalid={!!errors.status} label={s.label}
                    onChange={() => { setV((x) => ({ ...x, status: s.id, year: s.id === "graduated" ? "" : x.year })); clear("status", "year"); }} />
                ))}
              </div>
              <FieldError id="su-status-error" message={errors.status} />
            </fieldset>
          </div>)}

          {showYear && (
            <Field id="su-year" label="Academic year" error={errors.year}
              hint={!system ? "Choose your academic system above to see the available years." : isLmd && !v.level ? "Choose your level first." : undefined}>
              <Select id="su-year" value={v.year} disabled={!yearOptions.length} aria-invalid={!!errors.year}
                aria-describedby={describedBy("su-year", !system || (isLmd && !v.level), errors.year)} onChange={(e) => set("year", e.target.value)}>
                <option value="">{yearOptions.length ? "Select…" : isLmd ? "Choose your level first" : "Choose your system first"}</option>
                {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
              </Select>
            </Field>
          )}
        </>)}

        {step === 2 && (<>
          <Field id="su-motivation" label="Why do you want to join Lyceum?" error={errors.motivation}>
            <Textarea id="su-motivation" rows={6} value={v.motivation} aria-invalid={!!errors.motivation} aria-describedby={describedBy("su-motivation", false, errors.motivation)}
              placeholder="Tell us what motivates you, what you hope to learn and what you could bring to the club." onChange={(e) => set("motivation", e.target.value)} />
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-line"><span className="block h-full bg-fg transition-[width] duration-300" style={{ width: `${Math.min(100, (words / MIN_WORDS) * 100)}%` }} /></span>
              <span className={words >= MIN_WORDS ? "text-fg" : ""}>{words} / {MIN_WORDS} words minimum</span>
            </div>
          </Field>
          <fieldset className="grid gap-5 rounded-xl border border-line p-4">
            <legend className="px-2 text-sm font-medium text-zinc-300">Skills &amp; interests <span className="font-normal text-muted">(optional)</span></legend>
            <Field id="su-technical" label="Technical skills" hint="Press Enter or comma after each one."><TagInput id="su-technical" hint values={v.technical} onChange={(x) => set("technical", x)} placeholder="e.g. video editing, networking…" /></Field>
            <Field id="su-languages" label="Programming languages"><TagInput id="su-languages" values={v.languages} onChange={(x) => set("languages", x)} placeholder="e.g. Python, JavaScript…" /></Field>
            <Field id="su-interests" label="Areas of interest"><TagInput id="su-interests" values={v.interests} onChange={(x) => set("interests", x)} placeholder="e.g. debate, research, design…" /></Field>
          </fieldset>
          <Field id="su-cv" label={<>CV / Resume <span className="font-normal text-muted">(optional)</span></>}>
            <FileDropzone id="su-cv" file={v.cv} error={errors.cv} onChange={(file) => { setV((x) => ({ ...x, cv: file })); const m = validateCv(file); setErrors((e) => { const n = { ...e }; if (m) n.cv = m; else delete n.cv; return n; }); }} />
          </Field>
        </>)}
      </div>

      {submitError && (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden />
          <div>
            <p className="font-semibold text-red-300">Submission Error</p>
            <p>{submitError}</p>
          </div>
        </div>
      )}

      {Object.keys(errors).length > 0 && <p role="alert" className="rounded-lg border border-dashed border-fg/50 p-3 text-xs">Please fix the highlighted fields to continue.</p>}
      <div className="flex items-center justify-between gap-3">
        {step > 0 ? <Button type="button" variant="outline" disabled={submitting} onClick={back}><ArrowLeft className="h-4 w-4" aria-hidden />Back</Button> : <span />}
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving to Database…
            </>
          ) : step < 2 ? (
            <>Next<ArrowRight className="h-4 w-4" aria-hidden /></>
          ) : (
            "Submit Application"
          )}
        </Button>
      </div>
    </form>
  );
}
