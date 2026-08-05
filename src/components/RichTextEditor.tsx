"use client";

import { useEffect, useRef, useState } from "react";
import { Bold, Italic, Palette, Smile, Underline } from "lucide-react";
import RichText from "@/components/RichText";
import { AppleEmojiGlyph } from "@/components/AppleEmoji";

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

const EMOJIS = [
  "😀", "😁", "😂", "🤣", "😊", "😍", "🥰", "😘", "😜", "🤪", "😎", "🥳",
  "😅", "😭", "😇", "😴", "👍", "👎", "👏", "🙏", "💪", "🤝", "✌️", "🤞",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "💖", "✨", "🎉", "🔥", "⭐",
  "🍎", "🍊", "🍓", "☕", "🍜", "🎧", "📷", "💡", "🚀", "🌸", "🌈", "🐱",
];

const FONT_MAP: Record<string, string> = {
  system:
    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Microsoft YaHei", sans-serif',
  misans:
    '"MiSans", -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
  wenkai: '"LXGW WenKai", "Kaiti SC", "STKaiti", serif',
  smiley:
    '"Smiley Sans Oblique", "Smiley Sans", "PingFang SC", "Microsoft YaHei", sans-serif',
  serif: 'Georgia, "Times New Roman", "Songti SC", serif',
  mono: '"SF Mono", "Cascadia Code", "JetBrains Mono", Consolas, monospace',
  pixel:
    '"Fusion Pixel 12px Monospaced SC", "Zpix", "Press Start 2P", "SF Mono", monospace',
  maple:
    '"Maple Mono", "SF Mono", "Cascadia Code", "JetBrains Mono", Consolas, monospace',
  rounded:
    '"Arial Rounded MT Bold", "PingFang SC", "Microsoft YaHei", sans-serif',
};

const FONT_KEY_BY_FAMILY = Object.fromEntries(
  Object.entries(FONT_MAP).map(([key, value]) => [
    value.split(",")[0].trim().replace(/^"|"$/g, "").toLowerCase(),
    key,
  ]),
);

type FormatKind = "bold" | "italic" | "underline";
type FormatState = Record<FormatKind, boolean>;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeHex(value: string) {
  const trimmed = value.trim();
  if (/^#[0-9a-f]{3,8}$/i.test(trimmed)) {
    if (trimmed.length === 4) {
      return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
    }
    return trimmed.toLowerCase();
  }
  const rgb = trimmed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgb) {
    return `#${rgb
      .slice(1, 4)
      .map((part) => Number(part).toString(16).padStart(2, "0"))
      .join("")}`;
  }
  return trimmed.toLowerCase();
}

function fontKeyFromFamily(fontFamily: string) {
  const first = fontFamily
    .split(",")[0]
    .trim()
    .replace(/^"|"$/g, "")
    .toLowerCase();
  return FONT_KEY_BY_FAMILY[first] || null;
}

function richTextToHtml(value: string) {
  return escapeHtml(String(value))
    .replace(
      /^### (.*)$/gm,
      (_, text: string) => `<h3 class="rt-editor-heading">${text}</h3>`,
    )
    .replace(
      /^## (.*)$/gm,
      (_, text: string) => `<h2 class="rt-editor-heading">${text}</h2>`,
    )
    .replace(
      /^# (.*)$/gm,
      (_, text: string) => `<h2 class="rt-editor-heading">${text}</h2>`,
    )
    .replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>$1</strong>")
    .replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>$1</em>")
    .replace(/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>$1</u>")
    .replace(
      /\[font=([a-z0-9_-]+)\]([\s\S]*?)\[\/font\]/gi,
      (_, key: string, inner: string) =>
        `<span data-font-key="${key}" style="font-family:${FONT_MAP[key] || "inherit"}">${inner}</span>`,
    )
    .replace(
      /\[color=([#a-zA-Z0-9]{3,20})\]([\s\S]*?)\[\/color\]/gi,
      (_, color: string, inner: string) =>
        `<span style="color:${color}">${inner}</span>`,
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    .replace(/__([^_]+)__/g, "<u>$1</u>");
}

function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }
  const element = node as HTMLElement;
  const tag = element.tagName.toLowerCase();
  let inner = "";
  for (const child of Array.from(element.childNodes)) {
    inner += serializeNode(child);
  }
  if (tag === "br") {
    return "\n";
  }
  if (tag === "div" || tag === "p") {
    return `${inner}\n`;
  }
  if (tag === "strong" || tag === "b") {
    return `[b]${inner}[/b]`;
  }
  if (tag === "em" || tag === "i") {
    return `[i]${inner}[/i]`;
  }
  if (tag === "u") {
    return `[u]${inner}[/u]`;
  }
  const fontWeight = element.style.fontWeight;
  const fontStyle = element.style.fontStyle;
  const textDecoration =
    element.style.textDecorationLine || element.style.textDecoration || "";
  if (
    fontWeight === "bold" ||
    fontWeight === "bolder" ||
    (Number(fontWeight) >= 600 && fontWeight !== "")
  ) {
    inner = `[b]${inner}[/b]`;
  }
  if (fontStyle === "italic" || fontStyle === "oblique") {
    inner = `[i]${inner}[/i]`;
  }
  if (textDecoration.includes("underline")) {
    inner = `[u]${inner}[/u]`;
  }
  const color =
    element.style.color || (tag === "font" ? element.getAttribute("color") : null);
  if (color) {
    return `[color=${normalizeHex(color)}]${inner}[/color]`;
  }
  const fontKey =
    element.dataset.fontKey ||
    (tag === "font"
      ? fontKeyFromFamily(element.getAttribute("face") || "")
      : fontKeyFromFamily(element.style.fontFamily || ""));
  if (fontKey) {
    return `[font=${fontKey}]${inner}[/font]`;
  }
  return inner;
}

function serializeEditor(root: HTMLElement) {
  let result = "";
  for (const child of Array.from(root.childNodes)) {
    result += serializeNode(child);
  }
  return result.replace(/\n{3,}/g, "\n\n");
}

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
  const editorRef = useRef<HTMLDivElement | null>(null);
  const selectionRef = useRef<Range | null>(null);
  const suppressToolbarSyncRef = useRef(false);
  const suppressToolbarTimeoutRef = useRef<number | null>(null);
  const lastEmittedRef = useRef(value);
  const [draft, setDraft] = useState(value);
  const [activeFormats, setActiveFormats] = useState<FormatState>({
    bold: false,
    italic: false,
    underline: false,
  });
  const [activeColor, setActiveColor] = useState("");
  const [activeFont, setActiveFont] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [placeholderVisible, setPlaceholderVisible] = useState(!value.trim());

  function syncEditorHtml(raw: string) {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    editor.innerHTML = raw.trim() ? richTextToHtml(raw) : "";
    setPlaceholderVisible(!raw.trim());
  }

  function saveSelection() {
    const selection = window.getSelection();
    if (
      selection &&
      selection.rangeCount > 0 &&
      editorRef.current?.contains(selection.anchorNode)
    ) {
      selectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  }

  function restoreSelection() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    editor.focus();
    const selection = window.getSelection();
    if (!selection) {
      return;
    }
    if (selectionRef.current) {
      selection.removeAllRanges();
      selection.addRange(selectionRef.current);
    } else {
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  function updateToolbarState() {
    if (suppressToolbarSyncRef.current) {
      return;
    }
    if (!editorRef.current || document.activeElement !== editorRef.current) {
      return;
    }
    try {
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
      });
      const color = document.queryCommandValue("foreColor");
      setActiveColor(normalizeHex(color || ""));
      const fontName = document.queryCommandValue("fontName");
      setActiveFont(fontKeyFromFamily(fontName || "") || "");
    } catch {
      // queryCommand APIs are not available in every browser.
    }
  }

  function commitFromEditor() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    const raw = serializeEditor(editor);
    if (maxLength && raw.length > maxLength) {
      syncEditorHtml(lastEmittedRef.current);
      return;
    }
    lastEmittedRef.current = raw;
    setDraft(raw);
    setPlaceholderVisible(!raw.trim());
    onChange(raw);
    updateToolbarState();
  }

  function execCommand(command: string, commandValue?: string) {
    restoreSelection();
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    if (
      command === "bold" ||
      command === "italic" ||
      command === "underline" ||
      command === "foreColor"
    ) {
      document.execCommand("styleWithCSS", false, "true");
    }
    document.execCommand(command, false, commandValue);
    saveSelection();
    commitFromEditor();
  }

  function applyFormat(kind: FormatKind) {
    if (suppressToolbarTimeoutRef.current) {
      window.clearTimeout(suppressToolbarTimeoutRef.current);
    }
    suppressToolbarSyncRef.current = true;
    saveSelection();
    let wasActive = activeFormats[kind];
    try {
      wasActive = document.queryCommandState(kind);
    } catch {
      // Fall back to the locally tracked state when the browser does not expose it.
    }
    execCommand(kind);
    setActiveFormats((current) => ({ ...current, [kind]: !wasActive }));
    suppressToolbarTimeoutRef.current = window.setTimeout(() => {
      suppressToolbarSyncRef.current = false;
      suppressToolbarTimeoutRef.current = null;
    }, 400);
  }

  function applyColor(swatch: string) {
    execCommand("foreColor", swatch);
    setActiveColor(swatch);
  }

  function applyFont(key: string) {
    execCommand("fontName", FONT_MAP[key] || "inherit");
    setActiveFont(key);
  }

  function insertEmoji(emoji: string) {
    restoreSelection();
    const inserted = document.execCommand("insertText", false, emoji);
    if (!inserted) {
      document.execCommand("insertHTML", false, emoji);
    }
    saveSelection();
    commitFromEditor();
  }

  useEffect(() => {
    if (value === lastEmittedRef.current) {
      setPlaceholderVisible(!value.trim());
      return;
    }
    lastEmittedRef.current = value;
    setDraft(value);
    syncEditorHtml(value);
  }, [value]);

  useEffect(() => {
    // Seed the editable area once; later syncs happen through the value effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    syncEditorHtml(value);
    const onSelectionChange = () => updateToolbarState();
    document.addEventListener("selectionchange", onSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", onSelectionChange);
      if (suppressToolbarTimeoutRef.current) {
        window.clearTimeout(suppressToolbarTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-white/60 bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-1.5 border-b border-white/50 bg-white/35 px-3 py-2 dark:border-white/10 dark:bg-white/5">
        <button
          type="button"
          onClick={() => applyFormat("bold")}
          onMouseDown={(event) => event.preventDefault()}
          onPointerDown={(event) => event.preventDefault()}
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
          onMouseDown={(event) => event.preventDefault()}
          onPointerDown={(event) => event.preventDefault()}
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
          onMouseDown={(event) => event.preventDefault()}
          onPointerDown={(event) => event.preventDefault()}
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
          value={activeFont}
          onChange={(event) => {
            const next = event.target.value;
            if (next) {
              applyFont(next);
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
              onClick={() => applyColor(swatch)}
              onMouseDown={(event) => event.preventDefault()}
              className={`h-5 w-5 rounded-full border border-black/10 shadow-sm transition-transform duration-100 ease-out active:scale-90 ${
                activeColor === swatch
                  ? "scale-110 ring-2 ring-pixel-ink ring-offset-2"
                  : ""
              }`}
              style={{ backgroundColor: swatch }}
              aria-label={`文字颜色 ${swatch}`}
              title={swatch}
            />
          ))}
        </span>
        <button
          type="button"
          onClick={() => setEmojiOpen((open) => !open)}
          onMouseDown={(event) => event.preventDefault()}
          aria-pressed={emojiOpen}
          className={`icon-button !h-8 !w-8 ${
            emojiOpen ? "!bg-pixel-slate !text-white" : ""
          }`}
          title="表情"
          aria-label="表情"
        >
          <Smile className="h-3.5 w-3.5" />
        </button>
        {emojiOpen ? (
          <div className="flex w-full flex-wrap items-center gap-1 border-t border-white/50 bg-white/35 px-3 py-2 dark:border-white/10 dark:bg-white/5">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => insertEmoji(emoji)}
                className="apple-emoji flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-xl transition-transform duration-100 ease-out hover:border-white/50 hover:bg-white/60 active:scale-90 dark:hover:bg-white/15"
                aria-label={`插入表情 ${emoji}`}
                title={emoji}
              >
                <AppleEmojiGlyph emoji={emoji} />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="relative">
        {placeholderVisible ? (
          <p className="pointer-events-none absolute left-4 top-3 text-sm text-ink-faint">
            {placeholder}
          </p>
        ) : null}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          onInput={commitFromEditor}
          onBlur={saveSelection}
          onKeyUp={() => {
            saveSelection();
            updateToolbarState();
          }}
          onMouseUp={() => {
            saveSelection();
            updateToolbarState();
          }}
          className="resize-y overflow-y-auto whitespace-pre-wrap break-words px-4 py-3 text-sm leading-relaxed text-ink outline-none [&_.rt-editor-heading]:mt-4 [&_.rt-editor-heading:first-child]:mt-0 [&_.rt-editor-heading]:font-semibold [&_strong]:font-semibold dark:text-white"
          style={{ minHeight: `${rows * 1.5}rem` }}
        />
      </div>

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
