import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "outline" | "danger" | "ghost";
type ButtonSize = "md" | "sm";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "border border-border-strong bg-foreground text-background hover:opacity-85",
  outline: "border border-border-strong text-foreground hover:bg-foreground hover:text-background",
  danger: "border border-red-300 text-red-700 hover:bg-red-50",
  ghost: "border-0 text-muted hover:text-foreground p-0",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: "px-4 py-2.5 text-sm",
  sm: "px-3 py-1.5 text-xs",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 font-medium transition-opacity disabled:opacity-60",
        variant !== "ghost" && SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
