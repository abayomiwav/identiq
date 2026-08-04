interface DisclosureProps {
  summary: string;
  children: React.ReactNode;
}

export function Disclosure({ summary, children }: DisclosureProps) {
  return (
    <details className="group border-b border-border-strong py-5 first:pt-0 last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium text-foreground marker:content-none">
        {summary}
        <span className="shrink-0 text-lg text-muted transition-transform group-open:rotate-45">+</span>
      </summary>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{children}</p>
    </details>
  );
}
