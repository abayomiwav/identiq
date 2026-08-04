interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  cornerTicks?: boolean;
}

export function Panel({ cornerTicks = false, className = "", children, ...props }: PanelProps) {
  return (
    <div className={`panel ${cornerTicks ? "corner-ticks relative" : ""} ${className}`} {...props}>
      {children}
    </div>
  );
}
