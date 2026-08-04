"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Plus,
  Search,
  Star,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { friends } from "@/data/content";
import { fadeUp, staggerContainer } from "@/lib/motion";

export default function SharePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("全部");

  const categories = useMemo(
    () => ["全部", ...Array.from(new Set(friends.map((friend) => friend.category)))],
    [],
  );

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return friends.filter((friend) => {
      const matchCategory =
        category === "全部" || friend.category === category;
      const matchQuery =
        !keyword ||
        friend.name.toLowerCase().includes(keyword) ||
        friend.description.toLowerCase().includes(keyword) ||
        friend.tags.some((tag) => tag.toLowerCase().includes(keyword));
      return matchCategory && matchQuery;
    });
  }, [query, category]);

  return (
    <div className="pb-8">
      <PageHeader
        eyebrow="05 // LINKS"
        title="推荐分享与友链"
        description="收藏一些常去的平台、灵感与工具。好的地方值得被更多人看见。"
      />

      <div className="mx-auto mt-10 max-w-5xl px-5 sm:px-8">
        <div className="glass flex flex-col gap-4 rounded-4xl p-5 sm:flex-row sm:items-center">
          <label className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-white/60 bg-white/45 px-4 py-3 shadow-apple-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
            <Search className="h-4 w-4 shrink-0 text-ink-soft" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索友链、平台或标签"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft"
            />
            <span className="pixel-font hidden text-[14px] text-ink-soft sm:inline">
              FIND
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`chip transition-transform duration-150 ease-out active:scale-95 ${
                  category === item
                    ? "border-pixel-ink bg-pixel-cream text-pixel-ink shadow-pixel-sm"
                    : "hover:bg-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {visible.map((friend) => (
            <motion.article
              key={friend.name}
              variants={fadeUp}
              className="card-hover glass rounded-4xl"
            >
              <Link
                href={friend.url}
                target="_blank"
                rel="noreferrer"
                className="flex h-full flex-col p-6 sm:p-7"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="chip pixel-font !text-[14px]">
                    {friend.category}
                  </span>
                  <ArrowUpRight className="h-5 w-5 text-ink-soft" />
                </div>
                <h3 className="mt-5 text-xl font-semibold tracking-tight text-ink">
                  {friend.name}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">
                  {friend.description}
                </p>
                <div className="mt-5 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={`h-3.5 w-3.5 ${
                        index < friend.rating
                          ? "fill-accent-gold text-accent-gold"
                          : "text-ink-soft/30"
                      }`}
                    />
                  ))}
                </div>
                <div className="mt-auto flex flex-wrap gap-1.5 pt-5">
                  {friend.tags.map((tag) => (
                    <span key={tag} className="chip pixel-font !text-[14px]">
                      #{tag}
                    </span>
                  ))}
                </div>
              </Link>
            </motion.article>
          ))}

          <motion.article
            variants={fadeUp}
            className="rounded-4xl border-2 border-dashed border-white/60 bg-white/35 shadow-apple-sm backdrop-blur-xl dark:border-white/15 dark:bg-white/10"
          >
            <Link
              href="mailto:changfeng360@gmail.com"
              className="flex h-full min-h-[260px] flex-col items-center justify-center gap-4 p-7 text-center"
            >
              <span className="icon-button !h-12 !w-12">
                <Plus className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-ink">交换友链</p>
                <p className="mt-1 text-sm text-ink-soft">
                  带上你的博客，来交个朋友
                </p>
              </div>
            </Link>
          </motion.article>
        </motion.div>
      </div>
    </div>
  );
}
