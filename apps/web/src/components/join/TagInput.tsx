import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { describedBy } from "./Field";

interface Props { id: string; values: string[]; onChange: (v: string[]) => void; placeholder?: string; hint?: boolean; max?: number }

/** Type a value, press Enter or comma (or leave the field) to turn it into a removable chip. */
export function TagInput({ id, values, onChange, placeholder, hint, max = 15 }: Props) {
  const [text, setText] = useState("");
  const add = (raw: string) => {
    const t = raw.trim().replace(/,+$/, "").slice(0, 40);
    if (t && values.length < max && !values.some((v) => v.toLowerCase() === t.toLowerCase())) onChange([...values, t]);
    setText("");
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(text); }
    else if (e.key === "Backspace" && !text && values.length) onChange(values.slice(0, -1));
  };
  return (
    <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border border-line bg-bg p-1.5 transition-shadow focus-within:border-fg focus-within:ring-[3px] focus-within:ring-fg/25">
      {values.map((v) => (
        <span key={v} className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 py-1 pl-3 pr-1 text-xs">
          {v}
          <button type="button" aria-label={`Remove ${v}`} onClick={() => onChange(values.filter((x) => x !== v))} className="grid h-5 w-5 place-items-center rounded-full text-muted hover:bg-fg hover:text-bg"><X className="h-3 w-3" aria-hidden /></button>
        </span>
      ))}
      <input id={id} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} onBlur={() => add(text)} placeholder={values.length ? "" : placeholder}
        aria-describedby={describedBy(id, hint)} disabled={values.length >= max}
        className="min-w-[8rem] flex-1 bg-transparent px-2 py-1 text-sm text-fg outline-none placeholder:text-zinc-600" />
    </div>
  );
}
