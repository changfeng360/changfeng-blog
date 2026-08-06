"use client";

import { useEffect, useState } from "react";
import type { Friend, Photo, Post, Profile, Project } from "@/data/content";

export type RuntimeContent = {
  profile?: Profile;
  posts?: (Post & { body: string })[];
  projects?: Project[];
  friends?: Friend[];
  photos?: Photo[];
  music?: {
    id: string;
    title: string;
    artist: string;
    src: string;
    cover: string;
    duration: number;
  }[];
  site?: {
    baseFontSize: number;
    headingItalic: boolean;
    accentColor: string;
    backgroundColor: string;
    darkBackground: string;
    nowItems?: string[];
    sectionTitles?: Record<string, string>;
    sectionSubtitles?: Record<string, string>;
  };
};

const CACHE_KEY = "changfeng-runtime-content-v1";
const CACHE_TTL = 30_000;
let runtimeRequest: Promise<RuntimeContent> | null = null;

function readCacheWithMeta(): { data: RuntimeContent; fresh: boolean } {
  if (typeof window === "undefined") {
    return { data: {}, fresh: false };
  }
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) {
      return { data: {}, fresh: false };
    }
    const parsed = JSON.parse(raw) as {
      savedAt?: number;
      data?: RuntimeContent;
    };
    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.data &&
      typeof parsed.data === "object" &&
      typeof parsed.savedAt === "number" &&
      Date.now() - parsed.savedAt < CACHE_TTL
    ) {
      return { data: parsed.data, fresh: true };
    }
    return { data: {}, fresh: false };
  } catch {
    return { data: {}, fresh: false };
  }
}

function writeCache(content: RuntimeContent) {
  try {
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ savedAt: Date.now(), data: content }),
    );
  } catch {
    // Storage can be unavailable in private mode.
  }
}

function fetchRuntimeContent() {
  if (!runtimeRequest) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 6000);
    runtimeRequest = fetch("/api/content", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => response.json().catch(() => ({})))
      .then((data: RuntimeContent & { error?: string }) =>
        data && !data.error ? data : {},
      )
      .catch(() => ({}))
      .finally(() => {
        window.clearTimeout(timeoutId);
        runtimeRequest = null;
      });
  }
  return runtimeRequest;
}

export function useRuntimeContent() {
  const cached = readCacheWithMeta();
  const [content, setContent] = useState<RuntimeContent>(cached.data);
  const [loading, setLoading] = useState(!cached.fresh);

  useEffect(() => {
    let active = true;
    fetchRuntimeContent().then((data) => {
      if (active) {
        setContent(data);
        writeCache(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return { content, loading };
}
