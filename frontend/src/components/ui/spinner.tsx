interface SpinnerProps {
  label?: string;
}

export function Spinner({ label = "Loading…" }: SpinnerProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="h-3.5 w-3.5 animate-spin border-2 border-border-strong border-t-accent" />
      <span className="eyebrow !text-muted">{label}</span>
    </div>
  );
}
