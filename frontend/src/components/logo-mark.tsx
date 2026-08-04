interface LogoMarkProps {
  size?: number;
  className?: string;
}

/**
 * The Identiq mark: one identity node at the top, trusted by two permissioned
 * connections below — the product's whole model (verify once, grant access to
 * many) as a shape. Deliberately not a shield or padlock. Flat single accent
 * color, no gradient — matches the mark to the rest of the flat, bordered
 * visual system rather than standing apart as a glossy icon.
 */
export function LogoMark({ size = 32, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Identiq"
    >
      <line x1="24" y1="11" x2="11" y2="35" stroke="#2f3ee0" strokeWidth="3" strokeLinecap="round" />
      <line x1="24" y1="11" x2="37" y2="35" stroke="#2f3ee0" strokeWidth="3" strokeLinecap="round" />
      <circle cx="11" cy="35" r="5.5" fill="#fafaf9" stroke="#2f3ee0" strokeWidth="2.5" />
      <circle cx="37" cy="35" r="5.5" fill="#fafaf9" stroke="#2f3ee0" strokeWidth="2.5" />
      <circle cx="24" cy="11" r="7.5" fill="#2f3ee0" />
    </svg>
  );
}
