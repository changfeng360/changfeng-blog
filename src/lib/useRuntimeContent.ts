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

let runtimeRequest: Promise<RuntimeContent> | null = null;
let memoryCache: RuntimeContent | null = null;

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
  const [content, setContent] = useState<RuntimeContent>(memoryCache || {});
  const [loading, setLoading] = useState(!memoryCache);

  useEffect(() => {
    let active = true;
    fetchRuntimeContent().then((data) => {
      if (active) {
        memoryCache = data;
        setContent(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return { content, loading };
}
