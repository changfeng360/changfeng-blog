"use client";

import { useEffect, useRef, useState } from "react";
import { Bold, Italic, Palette, Underline } from "lucide-react";
import RichText from "@/components/RichText";

const FONT_OPTIONS = [
  { value: "", label: "默认字体" },
  { value: "misans", label: "MiSans 现代黑体" },
  { value: "wenkai", label: "霞鹜文楷" },
  { value: "smiley", label: "得意黑" },
  { value: "pixel", label: "Fusion Pixel" },
  { value: "maple", label: "Maple Mono" },
  { value: "serif", label: "系统衬线" },
  { value: "mono", label: "系统等宽" },
];

const COLOR_SWATCHES = [
  "#ff3b30",
  "#ff9f0a",
  "#ffd60a",
  "#30d158",
  "#0a84ff",
  "#bf5af2",
  "#ff375f",
  "#6ed3b6",
  "#86868b",
  "#1d1d1f",
];

type FormatKind = "bold" | "italic" | "underline";

const FORMAT_TAGS: Record<FormatKind, [string, string]> = {
  bold: ["[b]", "[/b]"],
  italic: ["[i]", "[/i]"],
  underline: ["[u]", "[/u]"],
};

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
  const [font, setFont] = useState("");
  const [draft, setDraft] = useState(value);
  const [activeFormats, setActiveFormats] = useState<Record<FormatKind, boolean>>({
    bold: false,
    italic: false,
    underline: false,
  });
  const prevValueRef = useRef(value);

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

  function commit(nextValue: string) {
    setDraft(nextValue);
    prevValueRef.current = nextValue;
    onChange(nextValue);
  }

  function applyFormat(kind: FormatKind) {
    const element = textareaRef.current;
    const selection = getSelection();
    const [before, after] = FORMAT_TAGS[kind];
    if (selection.start === selection.end) {
      setActiveFormats((current) => ({
        ...current,
        [kind]: !current[kind],
      }));
      return;
    }
    const selected = draft.slice(selection.start, selection.end);
    const hasTag =
      draft.slice(selection.start - before.length, selection.start) ===
        before &&
      draft.slice(selection.end, selection.end + after.length) === after;
    const next = hasTag
      ? draft.slice(0, selection.start - before.length) +
        selected +
        draft.slice(selection.end + after.length)
      : draft.slice(0, selection.start) +
        before +
        selected +
        after +
        draft.slice(selection.end);
    commit(next);
    setActiveFormats((current) => ({
      ...current,
      [kind]: !hasTag,
    }));
    window.requestAnimationFrame(() => {
      if (!element) {
        return;
      }
      element.focus();
      const caret = hasTag
        ? selection.start - before.length + selected.length
        : selection.start + before.length + selected.length;
      element.setSelectionRange(caret, caret);
      selectionRef.current = { start: caret, end: caret };
    });
  }

  function applyMarkup(before: string, after: string) {
    const element = textareaRef.current;
    const selection = getSelection();
    if (selection.start === selection.end) {
      return;
    }
    const selected = draft.slice(selection.start, selection.end);
    const next =
      draft.slice(0, selection.start) +
      before +
      selected +
      after +
      draft.slice(selection.end);
    commit(next);
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

  function findInsertion(previous: string, next: string) {
    let start = 0;
    const minLength = Math.min(previous.length, next.length);
    while (start < minLength && previous[start] === next[start]) {
      start += 1;
    }
    let previousEnd = previous.length;
    let nextEnd = next.length;
    while (
      previousEnd > start &&
      nextEnd > start &&
      previous[previousEnd - 1] === next[nextEnd - 1]
    ) {
      previousEnd -= 1;
      nextEnd -= 1;
    }
    const inserted = next.slice(start, nextEnd);
    if (!inserted) {
      return null;
    }
    return { start, inserted };
  }

  function handleTextChange(nextValue: string) {
    const previous = prevValueRef.current;
    const insertion = findInsertion(previous, nextValue);
    const active = (Object.keys(activeFormats) as FormatKind[]).filter(
      (kind) => activeFormats[kind],
    );

    if (
      insertion &&
      !insertion.inserted.includes("\n") &&
      active.length > 0
    ) {
      let wrapped = insertion.inserted;
      if (active.includes("bold")) {
        wrapped = `[b]${wrapped}[/b]`;
      }
      if (active.includes("italic")) {
        wrapped = `[i]${wrapped}[/i]`;
      }
      if (active.includes("underline")) {
        wrapped = `[u]${wrapped}[/u]`;
      }
      const formatted =
        nextValue.slice(0, insertion.start) +
        wrapped +
        nextValue.slice(insertion.start + insertion.inserted.length);
      commit(formatted);
      const caret = insertion.start + wrapped.length;
      window.requestAnimationFrame(() => {
        const element = textareaRef.current;
        if (!element) {
          return;
        }
        element.focus();
        element.setSelectionRange(caret, caret);
        selectionRef.current = { start: caret, end: caret };
      });
      return;
    }

    commit(nextValue);
  }

  useEffect(() => {
    setDraft(value);
    prevValueRef.current = value;
    if (!value.trim()) {
      setActiveFormats({
        bold: false,
        italic: false,
        underline: false,
      });
    }
  }, [value]);

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-white/60 bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-1.5 border-b border-white/50 bg-white/35 px-3 py-2 dark:border-white/10 dark:bg-white/5">
        <button
          type="button"
          onClick={() => applyFormat("bold")}
          aria-pressed={activeFormats.bold}
          className={`icon-button !h-8 !w-8 ${
            activeFormats.bold ? "!bg-pixel-slate !text-white" : ""
          }`}
          title="加粗"
          aria-label="加粗"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat("italic")}
          aria-pressed={activeFormats.italic}
          className={`icon-button !h-8 !w-8 ${
            activeFormats.italic ? "!bg-pixel-slate !text-white" : ""
          }`}
          title="斜体"
          aria-label="斜体"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat("underline")}
          aria-pressed={activeFormats.underline}
          className={`icon-button !h-8 !w-8 ${
            activeFormats.underline ? "!bg-pixel-slate !text-white" : ""
          }`}
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
              applyMarkup(`[font=${next}]`, "[/font]");
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
        <span className="flex flex-wrap items-center gap-1 rounded-full border border-white/60 bg-white/70 px-2 py-1 text-xs text-ink-soft backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
          <Palette className="h-3.5 w-3.5" />
          {COLOR_SWATCHES.map((swatch) => (
            <button
              key={swatch}
              type="button"
              onClick={() => applyMarkup(`[color=${swatch}]`, "[/color]")}
              className="h-5 w-5 rounded-full border border-black/10 shadow-sm transition-transform duration-100 ease-out active:scale-90"
              style={{ backgroundColor: swatch }}
              aria-label={`文字颜色 ${swatch}`}
              title={swatch}
            />
          ))}
        </span>
      </div>
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(event) => handleTextChange(event.target.value)}
        onSelect={syncSelection}
        onKeyUp={syncSelection}
        onBlur={syncSelection}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className="w-full resize-y bg-transparent px-4 py-3 text-sm leading-relaxed text-ink outline-none placeholder:text-ink-faint dark:text-white"
      />
      <div className="border-t border-white/50 bg-white/30 px-4 py-3 dark:border-white/10 dark:bg-white/5">
        <p className="pixel-font mb-2 text-[10px] text-ink-soft">PREVIEW</p>
        {draft.trim() ? (
          <RichText
            content={draft}
            className="max-h-36 overflow-y-auto text-sm leading-relaxed text-ink"
          />
        ) : (
          <p className="text-xs text-ink-faint">预览会显示格式效果</p>
        )}
      </div>
    </div>
  );
}
