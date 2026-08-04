type AlertTone = "error" | "success";

interface AlertProps {
  tone?: AlertTone;
  children: React.ReactNode;
}

const TONE_CLASSES: Record<AlertTone, string> = {
  error: "border-red-300 bg-red-50 text-red-700",
  success: "border-emerald-300 bg-emerald-50 text-emerald-700",
};

export function Alert({ tone = "error", children }: AlertProps) {
  return (
    <p role={tone === "error" ? "alert" : undefined} className={`border px-4 py-3 text-sm ${TONE_CLASSES[tone]}`}>
      {children}
    </p>
  );
}
