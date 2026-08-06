"use client";

import { useEffect, useState } from "react";
import type { Friend, Photo, Post, Profile, Project } from "@/data/content";

export type RuntimeContent = {
  profile?: Profile;
  posts?: (Post & { body: string })[];
  projects?: Project[];
  friends?: Friend[];
  photos?: Photo[];
  site?: {
    baseFontSize: number;
    headingItalic: boolean;
    accentColor: string;
    backgroundColor: string;
    darkBackground: string;
  };
};

const CACHE_KEY = "changfeng-runtime-content-v1";

function readCache(): RuntimeContent {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as RuntimeContent;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeCache(content: RuntimeContent) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(content));
  } catch {
    // Storage can be unavailable in private mode.
  }
}

export function useRuntimeContent() {
  const [content, setContent] = useState<RuntimeContent>(readCache);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch("/api/content", { cache: "no-store" })
      .then((response) => response.json().catch(() => ({})))
      .then((data: RuntimeContent & { error?: string }) => {
        if (active && data && !data.error) {
          setContent(data);
          writeCache(data);
        }
      })
      .catch(() => {
        // Keep the static fallback when the API is unavailable.
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return { content, loading };
}
