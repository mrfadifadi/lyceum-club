import { useState } from "react";
import { FileText, Trash2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { CV_EXTENSIONS, MAX_CV_MB } from "@/lib/validation";
import { describedBy } from "./Field";

const size = (b: number) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/** Click-or-drop file picker (PDF/DOC/DOCX). Nothing is uploaded anywhere in this phase. */
export function FileDropzone({ id, file, onChange, error }: { id: string; file: File | null; onChange: (f: File | null) => void; error?: string }) {
  const [over, setOver] = useState(false);
  return (
    <div className="grid gap-2">
      <label htmlFor={id} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); onChange(e.dataTransfer.files?.[0] ?? null); }}
        className={cn("flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-7 text-center transition-colors focus-within:border-fg focus-within:ring-[3px] focus-within:ring-fg/25",
          over ? "border-fg bg-surface-2" : "border-line hover:border-fg/60", error && "border-fg")}>
        <UploadCloud className="h-6 w-6 text-muted" aria-hidden />
        <span className="text-sm"><span className="font-medium underline underline-offset-4">Choose a file</span> <span className="text-muted">or drag it here</span></span>
        <span className="text-xs text-muted">PDF, DOC or DOCX · up to {MAX_CV_MB} MB</span>
        <input id={id} type="file" accept={CV_EXTENSIONS.join(",")} className="sr-only" aria-invalid={!!error} aria-describedby={describedBy(id, false, error)}
          onChange={(e) => { onChange(e.target.files?.[0] ?? null); e.target.value = ""; }} />
      </label>
      {file && (
        <div className="flex items-center gap-3 rounded-lg border border-line bg-bg px-3 py-2.5 text-sm">
          <FileText className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{file.name}</span><span className="text-xs text-muted">{size(file.size)}</span>
          <button type="button" aria-label="Remove file" onClick={() => onChange(null)} className="grid h-8 w-8 place-items-center rounded-md text-muted hover:text-fg"><Trash2 className="h-4 w-4" aria-hidden /></button>
        </div>)}
      {error && <p id={`${id}-error`} role="alert" className="text-xs text-fg">{error}</p>}
    </div>
  );
}
