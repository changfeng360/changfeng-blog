"use client";

import { Plus, Trash2 } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";

export const adminInputClass =
  "w-full rounded-2xl border border-white/60 bg-white/55 px-4 py-3 text-sm text-ink outline-none backdrop-blur-xl transition-colors duration-200 placeholder:text-ink-faint focus:border-accent-blue/60 dark:border-white/10 dark:bg-white/10 dark:text-white";

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-center justify-between gap-2 text-sm font-medium text-ink">
        {label}
        {hint ? (
          <span className="text-xs font-normal text-ink-soft">{hint}</span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  className,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`${adminInputClass} disabled:cursor-not-allowed disabled:opacity-60`}
      />
    </Field>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  rows = 5,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`${adminInputClass} resize-y font-mono text-xs leading-relaxed`}
      />
    </Field>
  );
}

export function RichTextAreaField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  rows = 6,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <RichTextEditor
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
      />
    </Field>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  hint,
  className,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  hint?: string;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(Number(event.target.value))}
        className={adminInputClass}
      />
    </Field>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
  hint,
  className,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
  className?: string;
}) {
  return (
    <label
      className={`flex items-center gap-3 rounded-2xl border border-white/60 bg-white/40 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 ${className}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-accent-blue"
      />
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint ? (
          <span className="block text-xs text-ink-soft">{hint}</span>
        ) : null}
      </span>
    </label>
  );
}

export function ColorField({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <Field label={label} className={className}>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-14 shrink-0 cursor-pointer rounded-xl border border-white/60 bg-white/55 p-1 backdrop-blur-xl dark:border-white/10 dark:bg-white/10"
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={adminInputClass}
        />
      </div>
    </Field>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  hint,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  hint?: string;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${adminInputClass} appearance-none`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function StringListField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  className,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <TextField
      label={label}
      value={value.join(", ")}
      onChange={(text) =>
        onChange(
          text
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        )
      }
      placeholder={placeholder}
      hint={hint}
      className={className}
    />
  );
}

export function SkillsEditor({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: { name: string; level: number }[];
  onChange: (value: { name: string; level: number }[]) => void;
  className?: string;
}) {
  return (
    <Field label={label} className={className}>
      <div className="space-y-2">
        {value.map((skill, index) => (
          <div
            key={index}
            className="flex items-center gap-2 rounded-2xl border border-white/60 bg-white/40 p-2 backdrop-blur-xl dark:border-white/10 dark:bg-white/10"
          >
            <input
              type="text"
              value={skill.name}
              onChange={(event) => {
                const next = [...value];
                next[index] = { ...skill, name: event.target.value };
                onChange(next);
              }}
              className="min-w-0 flex-1 bg-transparent px-2 text-sm text-ink outline-none placeholder:text-ink-faint dark:text-white"
              placeholder="技能名称"
            />
            <input
              type="range"
              min={0}
              max={100}
              value={skill.level}
              onChange={(event) => {
                const next = [...value];
                next[index] = {
                  ...skill,
                  level: Number(event.target.value),
                };
                onChange(next);
              }}
              className="pixel-range w-24"
              aria-label={`${skill.name} level`}
            />
            <span className="pixel-font w-10 text-right text-[12px] text-ink-soft">
              {skill.level}
            </span>
            <button
              type="button"
              onClick={() => {
                const next = value.filter((_, itemIndex) => itemIndex !== index);
                onChange(next);
              }}
              className="icon-button !h-8 !w-8 !border-pixel-red/30"
              aria-label="Remove skill"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...value, { name: "", level: 80 }])}
          className="chip transition-transform duration-150 ease-out active:scale-95 hover:bg-white"
        >
          <Plus className="h-3.5 w-3.5" />
          添加技能
        </button>
      </div>
    </Field>
  );
}
