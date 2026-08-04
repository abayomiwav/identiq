import { Panel } from "./panel";

interface StatCardProps {
  label: string;
  value: string;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <Panel className="p-6">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 text-2xl font-semibold accent-text">{value}</p>
    </Panel>
  );
}
