"use client";

import { useEffect, useRef } from "react";
import { Button } from "./button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  tone?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  tone = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={onCancel}
      onClose={onCancel}
      className="corner-ticks panel relative w-full max-w-sm p-6 backdrop:bg-black/50"
    >
      <h2 className="text-lg font-medium text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted">{description}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant={tone === "danger" ? "danger" : "primary"} size="sm" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
