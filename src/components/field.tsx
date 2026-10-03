import { HelpTip } from "@/components/help-tip";
import type { GlossaryKey } from "@/lib/glossary";

/** Campo de formulário com rótulo, tooltip didático, dica curta e erro inline. */
export function Field({
  label,
  term,
  hint,
  error,
  children,
}: {
  label: string;
  term: GlossaryKey;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          {label}
          <HelpTip term={term} label={label} />
        </span>
        {children}
      </label>
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
