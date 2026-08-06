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
let runtimeRequest: Promise<RuntimeContent> | null = null;

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
  const cached = readCache();
  const [content, setContent] = useState<RuntimeContent>(cached);
  const [loading, setLoading] = useState(false);

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
