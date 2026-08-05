"use client";

import Link from "next/link";
import { Rss } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mx-auto mt-20 max-w-6xl px-5 pb-10 sm:px-8">
      <div className="glass flex flex-col items-center justify-between gap-4 rounded-4xl px-6 py-5 sm:flex-row">
        <div className="flex items-center gap-2 text-sm text-ink-soft">
          <span className="pixel-font text-[13px] text-ink">
            CF.BLOG
          </span>
          <span>2026 长风的博客</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="#"
            className="icon-button"
            aria-label="RSS 订阅"
          >
            <Rss className="h-4 w-4" />
          </Link>
          <Link href="/blog" className="text-sm font-medium text-accent-blue">
            阅读全部文章
          </Link>
        </div>
      </div>
    </footer>
  );
}
