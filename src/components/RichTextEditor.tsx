"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bold,
  ChevronDown,
  Italic,
  Palette,
  Smile,
  Underline,
} from "lucide-react";
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
const FONT_OPTION_VALUES = new Set(FONT_OPTIONS.map((option) => option.value));

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
  const fontMenuRef = useRef<HTMLSpanElement | null>(null);
  const lastEmittedRef = useRef(value);
  const [draft, setDraft] = useState(value);
  const [activeFormats, setActiveFormats] = useState<FormatState>({
    bold: false,
    italic: false,
    underline: false,
  });
  const activeFormatsRef = useRef(activeFormats);
  const [activeColor, setActiveColor] = useState("");
  const [activeFont, setActiveFont] = useState("");
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
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
      commitFormats(formatStateAtSelection());
      const color = document.queryCommandValue("foreColor");
      const queriedColor = normalizeHex(color || "");
      const selection = window.getSelection();
      const range =
        selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      const fontName = document.queryCommandValue("fontName");
      const queriedFontKey = fontKeyFromFamily(fontName || "");
      setActiveFont(
        (FONT_OPTION_VALUES.has(queriedFontKey || "")
          ? (!range || range.collapsed ? "" : queriedFontKey)
          : "") ||
          fontKeyAtSelection() ||
          (range && range.collapsed ? activeFont : "") ||
          "",
      );
      setActiveColor(
        colorAtSelection() ||
          (range && range.collapsed ? activeColor : "") ||
          queriedColor ||
          "",
      );
    } catch {
      // queryCommand APIs are not available in every browser.
    }
  }

  function fontKeyAtSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return "";
    }
    let element =
      selection.anchorNode?.nodeType === Node.ELEMENT_NODE
        ? (selection.anchorNode as HTMLElement)
        : selection.anchorNode?.parentElement ?? null;
    while (element && element !== editorRef.current) {
      const face =
        element instanceof HTMLElement ? element.getAttribute("face") : null;
      const family =
        element instanceof HTMLElement ? element.style.fontFamily : "";
      const key =
        element instanceof HTMLElement ? element.dataset.fontKey || "" : "";
      const matchedKey =
        key || fontKeyFromFamily(face || family || "");
      if (matchedKey && FONT_OPTION_VALUES.has(matchedKey)) {
        return matchedKey;
      }
      element = element.parentElement;
    }

    let focusElement =
      selection.focusNode?.nodeType === Node.ELEMENT_NODE
        ? (selection.focusNode as HTMLElement)
        : selection.focusNode?.parentElement ?? null;
    while (focusElement && focusElement !== editorRef.current) {
      const face =
        focusElement instanceof HTMLElement
          ? focusElement.getAttribute("face")
          : null;
      const family =
        focusElement instanceof HTMLElement
          ? focusElement.style.fontFamily
          : "";
      const key =
        focusElement instanceof HTMLElement
          ? focusElement.dataset.fontKey || ""
          : "";
      const matchedKey =
        key || fontKeyFromFamily(face || family || "");
      if (matchedKey && FONT_OPTION_VALUES.has(matchedKey)) {
        return matchedKey;
      }
      focusElement = focusElement.parentElement;
    }
    return "";
  }

  function colorAtSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return "";
    }
    const readColor = (node: Node | null) => {
      let element =
        node?.nodeType === Node.ELEMENT_NODE
          ? (node as HTMLElement)
          : node?.parentElement ?? null;
      while (element && element !== editorRef.current) {
        const value =
          element.style.color ||
          (element.tagName === "FONT"
            ? element.getAttribute("color") || ""
            : "");
        if (
          value &&
          value.toLowerCase() !== "black" &&
          value.toLowerCase() !== "rgb(0, 0, 0)"
        ) {
          return normalizeHex(value);
        }
        element = element.parentElement;
      }
      return "";
    };
    return readColor(selection.anchorNode) || readColor(selection.focusNode);
  }

  function formatStateAtSelection(): FormatState {
    const selection = window.getSelection();
    const range =
      selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    if (!range || !range.collapsed) {
      try {
        return {
          bold: document.queryCommandState("bold"),
          italic: document.queryCommandState("italic"),
          underline: document.queryCommandState("underline"),
        };
      } catch {
        return { bold: false, italic: false, underline: false };
      }
    }

    const state: FormatState = {
      bold: false,
      italic: false,
      underline: false,
    };
    const readNode = (node: Node | null) => {
      let element =
        node?.nodeType === Node.ELEMENT_NODE
          ? (node as HTMLElement)
          : node?.parentElement ?? null;
      while (element && element !== editorRef.current) {
        const tag = element.tagName.toLowerCase();
        const fontWeight = element.style.fontWeight;
        const fontStyle = element.style.fontStyle;
        const decoration =
          element.style.textDecorationLine || element.style.textDecoration || "";
        if (
          tag === "b" ||
          tag === "strong" ||
          fontWeight === "bold" ||
          fontWeight === "bolder" ||
          (Number(fontWeight) >= 600 && fontWeight !== "")
        ) {
          state.bold = true;
        }
        if (
          tag === "i" ||
          tag === "em" ||
          fontStyle === "italic" ||
          fontStyle === "oblique"
        ) {
          state.italic = true;
        }
        if (tag === "u" || decoration.includes("underline")) {
          state.underline = true;
        }
        element = element.parentElement;
      }
    };
    readNode(selection.anchorNode);
    readNode(selection.focusNode);
    return state;
  }

  function markColorAtSelection(swatch: string) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    let element =
      selection.anchorNode?.nodeType === Node.ELEMENT_NODE
        ? (selection.anchorNode as HTMLElement)
        : selection.anchorNode?.parentElement ?? null;
    while (element && element !== editorRef.current) {
      const hasColor =
        Boolean(element.style.color) ||
        element.tagName === "FONT" ||
        Boolean(element.dataset.colorKey);
      if (hasColor) {
        element.style.color = swatch;
        element.setAttribute("data-color-key", swatch);
        return;
      }
      element = element.parentElement;
    }
  }

  function commitFormats(next: FormatState) {
    activeFormatsRef.current = next;
    setActiveFormats(next);
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
      command === "fontName" ||
      command === "foreColor"
    ) {
      document.execCommand("styleWithCSS", false, "true");
    }
    document.execCommand(command, false, commandValue);
    saveSelection();
    commitFromEditor();
  }

  function reapplyCollapsedFormats() {
    const selection = window.getSelection();
    const range =
      selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    if (!range || !range.collapsed) {
      return;
    }
    restoreSelection();
    for (const format of ["bold", "italic", "underline"] as FormatKind[]) {
      if (
        activeFormatsRef.current[format] &&
        !document.queryCommandState(format)
      ) {
        document.execCommand(format);
      }
    }
    saveSelection();
    commitFromEditor();
  }

  function applyFormat(kind: FormatKind) {
    suppressToolbarSyncRef.current = true;
    saveSelection();
    let wasActive = activeFormatsRef.current[kind];
    const selection = window.getSelection();
    const range =
      selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    if (range && !range.collapsed) {
      try {
        wasActive = document.queryCommandState(kind);
      } catch {
        // Keep the locally tracked state when the browser cannot report it.
      }
    }
    const nextFormats: FormatState = {
      ...activeFormatsRef.current,
      [kind]: !wasActive,
    };
    commitFormats(nextFormats);
    execCommand(kind);
    reapplyCollapsedFormats();
  }

  function applyColor(swatch: string) {
    suppressToolbarSyncRef.current = true;
    execCommand("foreColor", swatch);
    markColorAtSelection(swatch);
    reapplyCollapsedFormats();
    setActiveColor(swatch);
  }

  function applyFont(key: string) {
    suppressToolbarSyncRef.current = true;
    execCommand("fontName", FONT_MAP[key] || "inherit");
    markFontAtSelection(key);
    reapplyCollapsedFormats();
    setActiveFont(key);
  }

  function markFontAtSelection(key: string) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    let element =
      selection.anchorNode?.nodeType === Node.ELEMENT_NODE
        ? (selection.anchorNode as HTMLElement)
        : selection.anchorNode?.parentElement ?? null;
    while (element && element !== editorRef.current) {
      const hasFont =
        element.tagName === "FONT" ||
        Boolean(element.style.fontFamily) ||
        Boolean(element.dataset.fontKey);
      if (hasFont) {
        element.setAttribute("data-font-key", key);
        element.style.fontFamily = FONT_MAP[key] || "inherit";
        return;
      }
      element = element.parentElement;
    }

    const range = selection.getRangeAt(0);
    if (!range.collapsed) {
      const span = document.createElement("span");
      span.setAttribute("data-font-key", key);
      span.style.fontFamily = FONT_MAP[key] || "inherit";
      try {
        range.surroundContents(span);
      } catch {
        // Fall back to the browser formatting when wrapping is not possible.
      }
    }
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
    };
  }, []);

  useEffect(() => {
    if (!fontMenuOpen) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (fontMenuRef.current && target && !fontMenuRef.current.contains(target)) {
        setFontMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [fontMenuOpen]);

  return (
    <div
      className={`overflow-visible rounded-2xl border border-white/60 bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 ${className}`}
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
        <span ref={fontMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setFontMenuOpen((open) => !open)}
            onMouseDown={(event) => event.preventDefault()}
            onPointerDown={(event) => event.preventDefault()}
            className="flex h-8 items-center gap-2 rounded-full border border-white/60 bg-white/70 pl-3 pr-2 text-xs text-ink outline-none backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-white"
            aria-label="选择字体"
            aria-expanded={fontMenuOpen}
          >
            <span className="max-w-[110px] truncate">
              {FONT_OPTIONS.find((option) => option.value === activeFont)
                ?.label ?? "默认字体"}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-ink-soft" />
          </button>
          {fontMenuOpen ? (
            <div className="absolute left-0 top-full z-40 mt-2 w-52 overflow-hidden rounded-2xl border border-white/60 bg-white/75 p-1.5 shadow-apple-hover backdrop-blur-2xl dark:border-white/10 dark:bg-[#202126]/85">
              {FONT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    applyFont(option.value);
                    setFontMenuOpen(false);
                  }}
                  onMouseDown={(event) => event.preventDefault()}
                  onPointerDown={(event) => event.preventDefault()}
                  className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-xs transition-colors duration-150 ${
                    activeFont === option.value
                      ? "bg-pixel-slate text-white"
                      : "text-ink hover:bg-white/70 dark:text-white dark:hover:bg-white/10"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </span>
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
          onPointerDown={() => {
            suppressToolbarSyncRef.current = false;
          }}
          onKeyDown={(event) => {
            if (
              ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(
                event.key,
              )
            ) {
              suppressToolbarSyncRef.current = false;
            }
          }}
          onKeyUp={() => {
            saveSelection();
            updateToolbarState();
          }}
          onMouseUp={() => {
            suppressToolbarSyncRef.current = false;
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
