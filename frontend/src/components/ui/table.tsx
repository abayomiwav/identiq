export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return <thead className="eyebrow">{children}</thead>;
}

export function TableHeadRow({ children }: { children: React.ReactNode }) {
  return <tr className="border-b border-border-strong">{children}</tr>;
}

export function TableHeadCell({ children }: { children?: React.ReactNode }) {
  return <th className="px-6 py-3 font-medium">{children}</th>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({ children }: { children: React.ReactNode }) {
  return <tr className="border-b border-border last:border-0">{children}</tr>;
}

export function TableCell({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return <td className={`px-6 py-3 ${align === "right" ? "text-right" : ""}`}>{children}</td>;
}
