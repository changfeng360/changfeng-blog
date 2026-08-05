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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function RichText({
  content,
  className = "",
}: {
  content?: string;
  className?: string;
}) {
  const escaped = escapeHtml(String(content ?? ""))
    .replace(
      /^### (.*)$/gm,
      (_, text: string) => `<h3 class="rt-heading">${text}</h3>`,
    )
    .replace(
      /^## (.*)$/gm,
      (_, text: string) => `<h2 class="rt-heading">${text}</h2>`,
    )
    .replace(
      /^# (.*)$/gm,
      (_, text: string) => `<h2 class="rt-heading">${text}</h2>`,
    )
    .replace(
      /\[font=([a-z0-9_-]+)\]([\s\S]*?)\[\/font\]/gi,
      (_, key: string, inner: string) => {
        const family = FONT_MAP[key.toLowerCase()] || "inherit";
        return `<span style="font-family:${family}">${inner}</span>`;
      },
    )
    .replace(
      /\[color=([#a-zA-Z0-9]{3,20})\]([\s\S]*?)\[\/color\]/gi,
      (_, color: string, inner: string) =>
        `<span style="color:${color}">${inner}</span>`,
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    .replace(/__([^_]+)__/g, "<u>$1</u>");

  return (
    <div
      className={`whitespace-pre-wrap break-words [&_.rt-heading]:mt-4 [&_.rt-heading:first-child]:mt-0 [&_.rt-heading]:font-semibold [&_.rt-heading]:tracking-tight [&_.rt-heading]:text-ink [&_strong]:font-semibold ${className}`}
      dangerouslySetInnerHTML={{ __html: escaped }}
    />
  );
}
