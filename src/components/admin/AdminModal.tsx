"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export default function AdminModal({
  open,
  title,
  onClose,
  children,
  wide = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/15 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`glass-strong max-h-[88vh] w-full overflow-y-auto rounded-4xl p-6 sm:p-8 ${
          wide ? "max-w-4xl" : "max-w-2xl"
        }`}
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="pixel-font text-[12px] text-accent-blue">
              CF ADMIN
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-button !h-9 !w-9"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
