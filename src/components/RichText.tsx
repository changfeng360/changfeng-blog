"use client";

import { Fragment, type ReactNode } from "react";

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

type InlineFormat =
  | { kind: "bold" }
  | { kind: "italic" }
  | { kind: "underline" }
  | { kind: "font"; value: string }
  | { kind: "color"; value: string };

type Token =
  | { type: "text"; text: string }
  | { type: "open"; format: InlineFormat }
  | { type: "close"; format: InlineFormat }
  | { type: "toggle"; format: InlineFormat };

const TOKEN_RE =
  /(\[font=([a-z0-9_-]+)\]|\[\/font\]|\[color=([#a-zA-Z0-9]{3,20})\]|\[\/color\]|\*\*|\*|__)/g;

function tokenize(value: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;

  while ((match = TOKEN_RE.exec(value)) !== null) {
    if (match.index > last) {
      tokens.push({ type: "text", text: value.slice(last, match.index) });
    }
    const raw = match[0];
    if (raw.startsWith("[font=")) {
      tokens.push({
        type: "open",
        format: { kind: "font", value: match[2] },
      });
    } else if (raw === "[/font]") {
      tokens.push({ type: "close", format: { kind: "font", value: "" } });
    } else if (raw.startsWith("[color=")) {
      tokens.push({
        type: "open",
        format: { kind: "color", value: match[3] },
      });
    } else if (raw === "[/color]") {
      tokens.push({ type: "close", format: { kind: "color", value: "" } });
    } else if (raw === "**") {
      tokens.push({ type: "toggle", format: { kind: "bold" } });
    } else if (raw === "__") {
      tokens.push({ type: "toggle", format: { kind: "underline" } });
    } else if (raw === "*") {
      tokens.push({ type: "toggle", format: { kind: "italic" } });
    }
    last = match.index + raw.length;
  }

  if (last < value.length) {
    tokens.push({ type: "text", text: value.slice(last) });
  }
  return tokens;
}

function renderInlineChunk(
  value: string,
  initialStack: InlineFormat[] = [],
): { nodes: ReactNode[]; stack: InlineFormat[] } {
  const tokens = tokenize(value);
  const stack = initialStack.slice();
  const nodes: ReactNode[] = [];
  let buffer = "";
  let key = 0;

  function formatText(text: string, formats: InlineFormat[]): ReactNode {
    let node: ReactNode = <Fragment key={key++}>{text}</Fragment>;
    for (let index = formats.length - 1; index >= 0; index -= 1) {
      const format = formats[index];
      const itemKey = key++;
      if (format.kind === "bold") {
        node = <strong key={itemKey}>{node}</strong>;
      } else if (format.kind === "italic") {
        node = <em key={itemKey}>{node}</em>;
      } else if (format.kind === "underline") {
        node = <u key={itemKey}>{node}</u>;
      } else if (format.kind === "font") {
        node = (
          <span
            key={itemKey}
            style={{ fontFamily: FONT_MAP[format.value] || "inherit" }}
          >
            {node}
          </span>
        );
      } else if (format.kind === "color") {
        node = (
          <span key={itemKey} style={{ color: format.value }}>
            {node}
          </span>
        );
      }
    }
    return node;
  }

  function flush() {
    if (!buffer) {
      return;
    }
    nodes.push(formatText(buffer, stack.slice()));
    buffer = "";
  }

  for (const token of tokens) {
    if (token.type === "text") {
      buffer += token.text;
    } else if (token.type === "open") {
      flush();
      stack.push(token.format);
    } else if (token.type === "close") {
      flush();
      for (let index = stack.length - 1; index >= 0; index -= 1) {
        if (stack[index].kind === token.format.kind) {
          stack.splice(index, 1);
          break;
        }
      }
    } else {
      flush();
      const lastIndex = stack.length - 1;
      if (lastIndex >= 0 && stack[lastIndex].kind === token.format.kind) {
        stack.pop();
      } else {
        stack.push(token.format);
      }
    }
  }
  flush();
  return { nodes, stack };
}

export default function RichText({
  content,
  className = "",
}: {
  content?: string;
  className?: string;
}) {
  const text = String(content ?? "");
  const lines = text.split("\n");
  const output: ReactNode[] = [];
  let stack: InlineFormat[] = [];
  let key = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const heading = stack.length === 0 ? line.match(/^(#{1,3})\s+(.*)$/) : null;
    if (heading) {
      const level = heading[1].length;
      const Tag = level <= 2 ? "h2" : "h3";
      const rendered = renderInlineChunk(heading[2]);
      stack = rendered.stack;
      output.push(
        <Tag key={key++} className="rt-heading">
          {rendered.nodes}
        </Tag>,
      );
    } else {
      const rendered = renderInlineChunk(line, stack);
      stack = rendered.stack;
      output.push(<Fragment key={key++}>{rendered.nodes}</Fragment>);
    }
    if (index < lines.length - 1) {
      output.push("\n");
    }
  }

  return (
    <div
      className={`whitespace-pre-wrap break-words [&_.rt-heading]:mt-4 [&_.rt-heading:first-child]:mt-0 [&_.rt-heading]:font-semibold [&_.rt-heading]:tracking-tight [&_.rt-heading]:text-ink [&_strong]:font-semibold ${className}`}
    >
      {output}
    </div>
  );
}
