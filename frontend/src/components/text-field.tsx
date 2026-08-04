interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function TextField({ label, id, ...props }: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="eyebrow mb-2 block !text-foreground">
        {label}
      </label>
      <input
        id={id}
        {...props}
        className="w-full border border-border-strong bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none"
      />
    </div>
  );
}
