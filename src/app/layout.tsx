import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteFrame from "@/components/SiteFrame";
import { SettingsProvider } from "@/components/SettingsProvider";
import ThemeToggle from "@/components/ThemeToggle";
import { PlayerProvider } from "@/components/PlayerProvider";
import { AdminProvider } from "@/components/admin/AdminContext";
import AdminFloating from "@/components/admin/AdminFloating";
import { getSiteSettings } from "@/lib/site";

const siteSettings = getSiteSettings();

const siteStyle = {
  "--site-base-size": `${siteSettings.baseFontSize}px`,
  "--site-accent": siteSettings.accentColor,
  "--site-bg": siteSettings.backgroundColor,
  "--site-dark-bg": siteSettings.darkBackground,
  "--site-heading-style": siteSettings.headingItalic ? "italic" : "normal",
} as React.CSSProperties;

export const metadata: Metadata = {
  title: "长风的个人博客",
  description:
    "一个融合苹果式极简质感与复古像素趣味的个人博客与文章时间线。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f5f7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" style={siteStyle}>
      <body className="min-h-screen font-sans antialiased">
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/misans@4.1.0/lib/Normal/MiSans-Medium.min.css"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/misans@4.1.0/lib/Normal/MiSans-Bold.min.css"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@callmebill/lxgw-wenkai-web@1.522.0/style.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/cn-fontsource-smiley-sans-oblique-regular@1.0.1/font.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@fontsource/fusion-pixel-12px-monospaced-sc@5.2.5/400.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@fontsource/maple-mono@5.2.6/400.css"
        />
        <AdminProvider>
          <SettingsProvider>
            <PlayerProvider>
              <a
                href="#main"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:shadow-apple"
              >
                跳到主要内容
              </a>
              <SiteFrame>{children}</SiteFrame>
              <ThemeToggle />
              <AdminFloating />
            </PlayerProvider>
          </SettingsProvider>
        </AdminProvider>
      </body>
    </html>
  );
}
