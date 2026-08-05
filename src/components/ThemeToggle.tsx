"use client";

import { Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSettings } from "./SettingsProvider";

export default function ThemeToggle() {
  const { settings, updateSettings } = useSettings();
  const pathname = usePathname();
  const isDark = settings.theme === "dark";

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() =>
        updateSettings({ theme: isDark ? "light" : "dark" })
      }
      className="icon-button fixed bottom-5 left-5 z-50 h-12 w-12 shadow-apple-hover"
      aria-label={isDark ? "切换到浅色模式" : "切换到深色模式"}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
