"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Pencil,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import RichText from "@/components/RichText";
import AdminInlineEditor, {
  type AdminField,
} from "@/components/admin/AdminInlineEditor";
import { useAdmin } from "@/components/admin/AdminContext";
import type { Post } from "@/data/content";
import { fadeUp, SPRING_SOFT, staggerContainer } from "@/lib/motion";
import { useRuntimeContent } from "@/lib/useRuntimeContent";

type RangeKey = "日" | "周" | "月" | "年";

const ranges: Record<RangeKey, number> = {
  日: 1,
  周: 7,
  月: 30,
  年: 365,
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}

function splitMdx(raw: string) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  return {
    frontmatter: match?.[1] ?? "",
    body: match?.[2]?.trim() ?? raw,
  };
}

function serializePost(post: Post, body: string) {
  const tags = post.tags.map((tag) => `  - ${tag}`).join("\n");
  const featured = post.featured ? "featured: true\n" : "";
  return `---\ntitle: "${post.title}"\nslug: ${post.slug}\nexcerpt: "${post.excerpt}"\ndate: ${post.date}\nreadTime: "${post.readTime}"\nemoji: "${post.emoji}"\ntags:\n${tags}\n${featured}---\n\n${body}\n`;
}

export default function BlogTimeline({ posts }: { posts: Post[] }) {
  const { editMode, api } = useAdmin();
  const [postList, setPostList] = useState(posts);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Record<string, unknown> | null>(
    null,
  );
  const [range, setRange] = useState<RangeKey>("月");
  const { content: runtime, loading } = useRuntimeContent();

  useEffect(() => {
    if (runtime.posts) {
      setPostList(runtime.posts);
    }
  }, [runtime, loading]);

  const filtered = useMemo(() => {
    const cutoff = Date.now() - ranges[range] * 24 * 60 * 60 * 1000;
    return postList.filter((post) => new Date(post.date).getTime() >= cutoff);
  }, [postList, range]);

  const visible = filtered.length > 0 ? filtered : postList;

  if (loading) {
    return (
      <div className="px-5 pb-8 pt-24 text-center sm:px-8">
        <div className="glass mx-auto max-w-3xl rounded-4xl p-10 text-sm text-ink-soft">
          内容加载中...
        </div>
      </div>
    );
  }

  const fields: AdminField[] = [
    { name: "title", label: "Title" },
    { name: "excerpt", label: "Excerpt", type: "textarea" },
    { name: "date", label: "Date" },
    { name: "readTime", label: "Read time" },
    { name: "emoji", label: "Emoji" },
    { name: "featured", label: "Featured", type: "checkbox" },
    { name: "tags", label: "Tags", type: "array" },
    { name: "body", label: "Body", type: "textarea" },
  ];

  const startEdit = async (slug: string) => {
    try {
      const post = await api(`posts/${slug}`);
      const raw = post as { content: string };
      const parsed = splitMdx(raw.content);
      const current = postList.find((item) => item.slug === slug);
      if (!current) {
        return;
      }
      setEditingSlug(slug);
      setEditingData({
        ...current,
        body: parsed.body,
      } as unknown as Record<string, unknown>);
    } catch (error) {
      console.error(error);
    }
  };

  const savePost = async (data: Record<string, unknown>) => {
    if (!editingSlug) {
      return;
    }
    const draft = data as unknown as Post & { body: string };
    const content = serializePost(draft, draft.body);
    await api(`posts/${editingSlug}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    });
    setPostList((current) =>
      current.map((post) => (post.slug === editingSlug ? draft : post)),
    );
    setEditingSlug(null);
    setEditingData(null);
  };

  return (
    <div className="pb-8">
      <PageHeader
        eyebrow="02 // JOURNAL"
        title={runtime.site?.sectionTitles?.blog || "近期文章"}
        description="按时间线记录我在代码、设计与 Agent 世界里的探索。没有太多宏大叙事，都是认真留下的脚印。"
      />

      <div className="mx-auto mt-10 max-w-3xl px-5 sm:px-8">
        <div className="glass mx-auto flex w-fit rounded-full p-1">
          {(Object.keys(ranges) as RangeKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={`relative h-9 rounded-full px-3 text-sm font-medium transition-colors duration-200 sm:px-4 ${
                range === key ? "text-ink" : "text-ink-soft hover:text-ink"
              }`}
            >
              {range === key ? (
                <motion.span
                  layoutId="blog-range-pill"
                  className="absolute inset-0 rounded-full border border-white/60 bg-white/80 shadow-apple-sm"
                  transition={SPRING_SOFT}
                />
              ) : null}
              <span className="relative z-10">{key}</span>
            </button>
          ))}
        </div>
      </div>

      <motion.ul
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative mx-auto mt-12 max-w-3xl space-y-5 pl-8 sm:pl-10"
      >
        <span
          aria-hidden
          className="absolute bottom-4 left-[13px] top-4 w-[2px] bg-gradient-to-b from-pixel-ink/30 via-accent-mint/50 to-accent-blue/20 sm:left-[15px]"
        />
        {visible.map((post) => (
          <motion.li key={post.slug} variants={fadeUp} className="relative">
            <span
              aria-hidden
              className="absolute -left-8 top-5 h-4 w-4 border-2 border-pixel-ink bg-pixel-gold shadow-pixel-sm sm:-left-10"
            />
            <article className="glass rounded-4xl p-6 sm:p-7">
              {editingSlug === post.slug && editingData ? (
                <AdminInlineEditor
                  title={`Edit ${post.slug}`}
                  fields={fields}
                  data={editingData}
                  onSave={savePost}
                  onCancel={() => {
                    setEditingSlug(null);
                    setEditingData(null);
                  }}
                />
              ) : null}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="flex items-center gap-1.5 text-xs text-ink-soft">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDate(post.date)}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-ink-soft">
                  <Clock3 className="h-3.5 w-3.5" />
                  {post.readTime}
                </span>
                <span className="flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <span key={tag} className="chip pixel-font !text-[14px]">
                      #{tag}
                    </span>
                  ))}
                </span>
                {editMode ? (
                  <button
                    type="button"
                    onClick={() => startEdit(post.slug)}
                    className="icon-button !h-8 !w-8"
                    aria-label={`Edit ${post.slug}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
              <h2 className="mt-4 text-xl font-semibold leading-snug tracking-tight text-ink sm:text-2xl">
                {post.title}
              </h2>
              <RichText
                content={post.excerpt}
                className="mt-2 text-sm leading-relaxed text-ink-soft"
              />
              <Link
                href={`/article?slug=${encodeURIComponent(post.slug)}`}
                className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-accent-blue"
              >
                阅读笔记
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </article>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}
