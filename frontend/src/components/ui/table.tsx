export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
      </div>
      {/* Below 640px the table scrolls sideways; fade the edge so that's discoverable. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-card to-transparent sm:hidden"
      />
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
