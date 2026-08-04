import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { SettingsProvider } from "@/components/SettingsProvider";
import ThemeToggle from "@/components/ThemeToggle";
import { PlayerProvider } from "@/components/PlayerProvider";

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
    <html lang="zh-CN">
      <body className="min-h-screen font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:shadow-apple"
        >
          跳到主要内容
        </a>
        <SettingsProvider>
          <PlayerProvider>
            <Nav />
            <main id="main">{children}</main>
            <Footer />
            <ThemeToggle />
          </PlayerProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
