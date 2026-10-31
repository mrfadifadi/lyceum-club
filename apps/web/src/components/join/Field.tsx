import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";

export const FieldError = ({ id, message }: { id: string; message?: string }) =>
  message ? <p id={id} role="alert" className="flex items-center gap-1.5 text-xs text-fg"><AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />{message}</p> : null;

/** Label + control + hint + inline error. `describedBy(id, …)` gives the matching aria-describedby for the control. */
export const describedBy = (id: string, hint?: boolean, error?: string) => [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

export function Field({ id, label, hint, error, children }: { id: string; label: ReactNode; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p id={`${id}-hint`} className="text-xs text-muted">{hint}</p>}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}
