interface EmptyStateProps {
  children: React.ReactNode;
}

export function EmptyState({ children }: EmptyStateProps) {
  return <p className="p-6 text-sm text-muted">{children}</p>;
}
