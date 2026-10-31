import { AlertCircle, CheckCircle2 } from "lucide-react";

export const PREVIEW_NOTE = "Everything looks valid, but this is a front-end preview: nothing was sent, no file was uploaded, no account was created and nobody was signed in. Authentication will be connected in a later phase.";

export function Feedback({ done, hasErrors }: { done: boolean; hasErrors: boolean }) {
  return (
    <div aria-live="polite">
      {done && <p className="flex gap-2 rounded-lg border border-line bg-bg p-3 text-xs text-fg"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{PREVIEW_NOTE}</p>}
      {hasErrors && <p className="flex gap-2 rounded-lg border border-dashed border-fg/50 p-3 text-xs text-fg"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />Please fix the highlighted fields.</p>}
    </div>
  );
}
