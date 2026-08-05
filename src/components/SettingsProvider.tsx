"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type ThemeMode = "light" | "dark" | "system";

export type Settings = {
  theme: ThemeMode;
};

type SettingsContextValue = {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
};

const defaultSettings: Settings = {
  theme: "light",
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

const STORAGE_KEY = "pixel-blog-settings";

function readStoredSettings(): Settings {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultSettings;
    }
    const parsed = JSON.parse(stored) as Partial<Settings>;
    return {
      ...defaultSettings,
      ...parsed,
      theme: ["light", "dark", "system"].includes(parsed.theme ?? "")
        ? (parsed.theme as ThemeMode)
        : defaultSettings.theme,
    };
  } catch {
    return defaultSettings;
  }
}

export function SettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    setSettings(readStoredSettings());
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = () => {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      const isDark =
        settings.theme === "dark" ||
        (settings.theme === "system" && prefersDark);
      root.classList.toggle("dark", isDark);
      root.style.colorScheme = isDark ? "dark" : "light";
    };

    applyTheme();

    if (settings.theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      media.addEventListener("change", applyTheme);
      return () => media.removeEventListener("change", applyTheme);
    }
  }, [settings.theme]);

  useEffect(() => {
    fetch("/api/content")
      .then((response) => response.json().catch(() => ({})))
      .then((data: { site?: SiteSettingsFromApi }) => {
        const site = data.site;
        if (!site) {
          return;
        }
        const root = window.document.documentElement;
        root.style.setProperty("--site-base-size", `${site.baseFontSize}px`);
        root.style.setProperty("--site-accent", site.accentColor);
        root.style.setProperty("--site-bg", site.backgroundColor);
        root.style.setProperty("--site-dark-bg", site.darkBackground);
        root.style.setProperty(
          "--site-heading-style",
          site.headingItalic ? "italic" : "normal",
        );
      })
      .catch(() => {
        // Keep the build-time site settings when the API is unavailable.
      });
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

type SiteSettingsFromApi = {
  baseFontSize: number;
  headingItalic: boolean;
  accentColor: string;
  backgroundColor: string;
  darkBackground: string;
};

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used inside SettingsProvider");
  }
  return context;
}
