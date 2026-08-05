"use client";

import { Fragment, useEffect, useState, type CSSProperties } from "react";

type EmojiPosition = { x: number; y: number };
type EmojiMeta = {
  size: number;
  width: number;
  height: number;
};
type EmojiMap = Record<string, EmojiPosition> & {
  __meta?: EmojiMeta;
};

const SHEET_URL = "/emoji/apple-sheet.png";

let emojiMapPromise: Promise<EmojiMap> | null = null;

function loadEmojiMap(): Promise<EmojiMap> {
  if (!emojiMapPromise) {
    emojiMapPromise = fetch("/emoji/emoji-map.json", { cache: "force-cache" })
      .then((response) => (response.ok ? response.json() : {}))
      .catch(() => ({}));
  }
  return emojiMapPromise;
}

function codePointKey(grapheme: string) {
  const parts: string[] = [];
  for (const char of grapheme) {
    const codePoint = char.codePointAt(0);
    if (codePoint === undefined) {
      continue;
    }
    const hex = codePoint.toString(16).toLowerCase();
    parts.push(hex.length < 4 ? hex.padStart(4, "0") : hex);
  }
  return parts.join("-");
}

function splitGraphemes(value: string) {
  const Segmenter = (
    Intl as unknown as {
      Segmenter?: new (
        locales?: string | string[],
        options?: { granularity?: "grapheme" },
      ) => {
        segment: (input: string) => Iterable<{ segment: string }>;
      };
    }
  ).Segmenter;

  if (Segmenter) {
    const segmenter = new Segmenter(undefined, { granularity: "grapheme" });
    return Array.from(segmenter.segment(value), (item) => item.segment);
  }
  return Array.from(value);
}

function useEmojiMap() {
  const [map, setMap] = useState<EmojiMap>({});

  useEffect(() => {
    let active = true;
    loadEmojiMap().then((next) => {
      if (active) {
        setMap(next);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return map;
}

function spriteStyle(
  position: EmojiPosition,
  meta: EmojiMeta,
  displaySize: number,
): CSSProperties {
  const scale = displaySize / meta.size;
  return {
    width: `${displaySize}px`,
    height: `${displaySize}px`,
    backgroundImage: `url("${SHEET_URL}")`,
    backgroundSize: `${meta.width * scale}px ${meta.height * scale}px`,
    backgroundPosition: `${-(position.x * (meta.size + 2) + 1) * scale}px ${
      -(position.y * (meta.size + 2) + 1) * scale
    }px`,
    backgroundRepeat: "no-repeat",
  };
}

function emojiSpriteStyle(
  position: EmojiPosition,
  meta: EmojiMeta,
  emSize: number,
): CSSProperties {
  const scale = emSize / meta.size;
  return {
    width: `${emSize}em`,
    height: `${emSize}em`,
    backgroundImage: `url("${SHEET_URL}")`,
    backgroundSize: `${meta.width * scale}em ${meta.height * scale}em`,
    backgroundPosition: `${-(position.x * (meta.size + 2) + 1) * scale}em ${
      -(position.y * (meta.size + 2) + 1) * scale
    }em`,
    backgroundRepeat: "no-repeat",
  };
}

export function AppleEmojiGlyph({
  emoji,
  className = "",
}: {
  emoji: string;
  className?: string;
}) {
  const map = useEmojiMap();
  const position = map[codePointKey(emoji)];
  const meta = map.__meta;

  if (!position || !meta) {
    return (
      <span className={`apple-emoji leading-none ${className}`}>{emoji}</span>
    );
  }

  return (
    <span
      className={`inline-block object-contain ${className}`}
      style={spriteStyle(position, meta, 24)}
    />
  );
}

export default function AppleEmojiText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const map = useEmojiMap();
  const meta = map.__meta;
  const segments = splitGraphemes(text);
  let key = 0;

  return (
    <>
      {segments.map((segment) => {
        const position = map[codePointKey(segment)];
        if (!position || !meta) {
          return <Fragment key={key++}>{segment}</Fragment>;
        }
        return (
          <span
            key={key++}
            className={`inline-block align-[-0.16em] ${className}`}
            style={emojiSpriteStyle(position, meta, 1.2)}
          />
        );
      })}
    </>
  );
}
