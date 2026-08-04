type BadgeTone = "success" | "warning" | "danger" | "neutral";

interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  success: "border-emerald-600 text-emerald-700",
  warning: "border-amber-600 text-amber-700",
  danger: "border-red-600 text-red-700",
  neutral: "border-border-strong text-muted",
};

export function Badge({ tone = "neutral", children }: BadgeProps) {
  return (
    <span className={`border px-2 py-0.5 font-mono text-[11px] uppercase ${TONE_CLASSES[tone]}`}>{children}</span>
  );
}
