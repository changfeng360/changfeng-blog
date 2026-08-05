"use client";

import { useRef, useState } from "react";
import { Bold, Italic, Palette, Underline } from "lucide-react";

const FONT_OPTIONS = [
  { value: "", label: "默认字体" },
  { value: "system", label: "系统字体" },
  { value: "serif", label: "衬线字体" },
  { value: "mono", label: "等宽字体" },
  { value: "pixel", label: "像素字体" },
  { value: "rounded", label: "圆体" },
];

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  rows = 6,
  className = "",
  maxLength,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  maxLength?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const [color, setColor] = useState("#ff3b30");
  const [font, setFont] = useState("");

  function syncSelection() {
    const element = textareaRef.current;
    if (!element) {
      return;
    }
    selectionRef.current = {
      start: element.selectionStart,
      end: element.selectionEnd,
    };
  }

  function getSelection() {
    const element = textareaRef.current;
    if (element && document.activeElement === element) {
      return {
        start: element.selectionStart,
        end: element.selectionEnd,
      };
    }
    return selectionRef.current;
  }

  function applyFormat(before: string, after: string) {
    const element = textareaRef.current;
    const selection = getSelection();
    if (selection.start === selection.end) {
      return;
    }
    const selected = value.slice(selection.start, selection.end);
    const next =
      value.slice(0, selection.start) +
      before +
      selected +
      after +
      value.slice(selection.end);
    onChange(next);
    window.requestAnimationFrame(() => {
      if (!element) {
        return;
      }
      element.focus();
      const caret = selection.start + before.length + selected.length;
      element.setSelectionRange(caret, caret);
      selectionRef.current = { start: caret, end: caret };
    });
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-white/60 bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-1.5 border-b border-white/50 bg-white/35 px-3 py-2 dark:border-white/10 dark:bg-white/5">
        <button
          type="button"
          onClick={() => applyFormat("**", "**")}
          className="icon-button !h-8 !w-8"
          title="加粗"
          aria-label="加粗"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat("*", "*")}
          className="icon-button !h-8 !w-8"
          title="斜体"
          aria-label="斜体"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat("__", "__")}
          className="icon-button !h-8 !w-8"
          title="下划线"
          aria-label="下划线"
        >
          <Underline className="h-3.5 w-3.5" />
        </button>
        <span className="mx-1 hidden h-5 w-px bg-white/50 sm:block dark:bg-white/15" />
        <select
          value={font}
          onChange={(event) => {
            const next = event.target.value;
            setFont(next);
            if (next) {
              applyFormat(`[font=${next}]`, "[/font]");
            }
          }}
          className="h-8 rounded-full border border-white/60 bg-white/70 px-3 text-xs text-ink outline-none backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-white"
          aria-label="选择字体"
        >
          {FONT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="flex items-center gap-1.5 rounded-full border border-white/60 bg-white/70 px-2.5 py-1 text-xs text-ink-soft backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
          <Palette className="h-3.5 w-3.5" />
          <input
            type="color"
            value={color}
            onChange={(event) => {
              const next = event.target.value;
              setColor(next);
              applyFormat(`[color=${next}]`, "[/color]");
            }}
            className="h-6 w-8 cursor-pointer rounded-md border-0 bg-transparent p-0"
            aria-label="选择颜色"
          />
        </span>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onSelect={syncSelection}
        onKeyUp={syncSelection}
        onBlur={syncSelection}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className="w-full resize-y bg-transparent px-4 py-3 text-sm leading-relaxed text-ink outline-none placeholder:text-ink-faint dark:text-white"
      />
    </div>
  );
}
