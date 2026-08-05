"use client";

import { useEffect, useState } from "react";
import type { Friend, Post, Profile, Project } from "@/data/content";

export type RuntimeContent = {
  profile?: Profile;
  posts?: (Post & { body: string })[];
  projects?: Project[];
  friends?: Friend[];
  site?: {
    baseFontSize: number;
    headingItalic: boolean;
    accentColor: string;
    backgroundColor: string;
    darkBackground: string;
  };
};

export function useRuntimeContent() {
  const [content, setContent] = useState<RuntimeContent>({});

  useEffect(() => {
    let active = true;
    fetch("/api/content")
      .then((response) => response.json().catch(() => ({})))
      .then((data: RuntimeContent & { error?: string }) => {
        if (active && data && !data.error) {
          setContent(data);
        }
      })
      .catch(() => {
        // Keep the static fallback when the API is unavailable.
      });
    return () => {
      active = false;
    };
  }, []);

  return content;
}
