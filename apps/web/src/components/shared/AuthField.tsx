import { useState, type ComponentProps } from "react";
import { AlertCircle, Eye, EyeOff, type LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props extends Omit<ComponentProps<"input">, "id"> { id: string; label: string; icon: LucideIcon; error?: string; password?: boolean }

/** Labelled input with icon, inline error and (optional) password visibility toggle. */
export function AuthField({ id, label, icon: Icon, error, password, ...rest }: Props) {
  const [show, setShow] = useState(false);
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
        <Input id={id} type={password && !show ? "password" : password ? "text" : rest.type} className={`pl-10 ${password ? "pr-11" : ""}`}
          aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} {...rest} />
        {password && (
          <button type="button" aria-label={show ? "Hide password" : "Show password"} aria-pressed={show} onClick={() => setShow((v) => !v)}
            className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-zinc-400 hover:text-zinc-100">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>)}
      </div>
      {error && <p id={`${id}-error`} role="alert" className="flex items-center gap-1.5 text-xs text-fg"><AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />{error}</p>}
    </div>
  );
}
