import { Panel } from "./panel";

type StatTone = "accent" | "teal" | "amber" | "rose";

interface StatCardProps {
  label: string;
  value: string;
  tone?: StatTone;
}

const TONE_CLASSES: Record<StatTone, { text: string; bar: string }> = {
  accent: { text: "text-accent", bar: "bg-accent" },
  teal: { text: "text-accent-teal", bar: "bg-accent-teal" },
  amber: { text: "text-accent-amber", bar: "bg-accent-amber" },
  rose: { text: "text-accent-rose", bar: "bg-accent-rose" },
};

export function StatCard({ label, value, tone = "accent" }: StatCardProps) {
  const classes = TONE_CLASSES[tone];
  return (
    <Panel className="relative overflow-hidden p-6">
      <span className={`absolute inset-x-0 top-0 h-1 ${classes.bar}`} />
      <p className="eyebrow">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${classes.text}`}>{value}</p>
    </Panel>
  );
}
