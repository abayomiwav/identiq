interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, id, className = "", ...props }: SelectProps) {
  const select = (
    <select
      id={id}
      className={`border border-border-strong bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none ${className}`}
      {...props}
    />
  );

  if (!label) return select;

  return (
    <div>
      <label htmlFor={id} className="eyebrow mb-2 block !text-foreground">
        {label}
      </label>
      {select}
    </div>
  );
}
