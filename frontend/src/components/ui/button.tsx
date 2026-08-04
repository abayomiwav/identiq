import { forwardRef } from "react";

type ButtonVariant = "primary" | "outline" | "danger" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "border border-border-strong bg-foreground text-background hover:opacity-85",
  outline: "border border-border-strong text-foreground hover:bg-foreground hover:text-background",
  danger: "border border-red-300 text-red-700 hover:bg-red-50",
  ghost: "text-muted hover:text-foreground",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={`px-4 py-2.5 text-sm font-medium transition-opacity disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  ),
);
Button.displayName = "Button";
