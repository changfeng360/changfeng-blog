"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

export type AdminField = {
  name: string;
  label: string;
  type?:
    | "text"
    | "textarea"
    | "number"
    | "checkbox"
    | "color"
    | "array"
    | "json";
  placeholder?: string;
};

type AdminDraft = Record<string, unknown>;

export default function AdminInlineEditor({
  title,
  fields,
  data,
  onSave,
  onCancel,
}: {
  title: string;
  fields: AdminField[];
  data: AdminDraft;
  onSave: (data: AdminDraft) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<AdminDraft>(data);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setDraft(data);
  }, [data]);

  const update = (name: string, value: unknown) => {
    setDraft((current) => ({ ...current, [name]: value }));
  };

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await onSave(draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    "w-full rounded-2xl border border-white/60 bg-white/60 px-4 py-2.5 text-sm text-ink outline-none backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-white";

  return (
    <div className="relative z-30 rounded-3xl border border-white/60 bg-white/90 p-5 shadow-apple-hover backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/90">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink dark:text-white">
          {title}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCancel}
            className="icon-button !h-8 !w-8"
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="pixel-btn rounded-full px-3 py-1.5 text-xs"
          >
            <Check className="h-3.5 w-3.5" />
            {busy ? "Saving" : "Save"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {fields.map((field) => {
          const value = draft[field.name];

          if (field.type === "checkbox") {
            return (
              <label
                key={field.name}
                className="flex items-center gap-2 text-sm text-ink dark:text-white"
              >
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(event) =>
                    update(field.name, event.target.checked)
                  }
                  className="h-4 w-4 accent-accent-blue"
                />
                {field.label}
              </label>
            );
          }

          if (field.type === "array") {
            return (
              <label key={field.name} className="sm:col-span-2">
                <span className="mb-1 block text-xs text-ink-soft">
                  {field.label}
                </span>
                <textarea
                  value={Array.isArray(value) ? value.join(", ") : ""}
                  onChange={(event) =>
                    update(
                      field.name,
                      event.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    )
                  }
                  className={`${inputClass} h-20 resize-y font-mono text-xs`}
                />
              </label>
            );
          }

          if (field.type === "json") {
            return (
              <label key={field.name} className="sm:col-span-2">
                <span className="mb-1 block text-xs text-ink-soft">
                  {field.label}
                </span>
                <textarea
                  value={
                    typeof value === "string"
                      ? value
                      : JSON.stringify(value, null, 2)
                  }
                  onChange={(event) => update(field.name, event.target.value)}
                  className={`${inputClass} h-40 resize-y font-mono text-xs`}
                />
              </label>
            );
          }

          return (
            <label
              key={field.name}
              className={field.type === "textarea" ? "sm:col-span-2" : ""}
            >
              <span className="mb-1 block text-xs text-ink-soft">
                {field.label}
              </span>
              {field.type === "textarea" ? (
                <textarea
                  value={String(value ?? "")}
                  onChange={(event) => update(field.name, event.target.value)}
                  className={`${inputClass} h-32 resize-y font-mono text-xs`}
                />
              ) : (
                <input
                  type={
                    field.type === "number"
                      ? "number"
                      : field.type === "color"
                        ? "color"
                        : "text"
                  }
                  value={String(value ?? "")}
                  onChange={(event) => update(field.name, event.target.value)}
                  className={inputClass}
                />
              )}
            </label>
          );
        })}
      </div>

      {error ? (
        <p className="mt-3 text-sm text-accent-pink">{error}</p>
      ) : null}
    </div>
  );
}
