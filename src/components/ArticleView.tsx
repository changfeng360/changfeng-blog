"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarDays, Clock3 } from "lucide-react";
import RichText from "@/components/RichText";
import type { Post } from "@/data/content";
import { useRuntimeContent } from "@/lib/useRuntimeContent";

type ArticlePost = Post & { body: string };

export default function ArticleView({
  slug,
  initialPost,
}: {
  slug: string;
  initialPost?: ArticlePost;
}) {
  const [post, setPost] = useState<ArticlePost | null>(initialPost ?? null);
  const { content: runtime, loading } = useRuntimeContent();

  useEffect(() => {
    const next = runtime.posts?.find((item) => item.slug === slug);
    if (next) {
      setPost(next);
    }
  }, [runtime, loading, slug]);

  if (loading) {
    return (
      <div className="px-5 pb-8 pt-40 text-center sm:px-8">
        <p className="text-sm text-ink-soft">内容加载中...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="px-5 pb-8 pt-40 text-center sm:px-8">
        <p className="text-sm text-ink-soft">文章加载中或不存在...</p>
      </div>
    );
  }

  const date = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(post.date));

  return (
    <div className="px-5 pb-8 pt-32 sm:px-8 sm:pt-40">
      <article className="mx-auto max-w-3xl">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          返回文章列表
        </Link>

        <header className="mt-8">
          <span className="text-4xl">{post.emoji}</span>
          <h1 className="mt-4 text-3xl font-semibold leading-[1.12] tracking-tight text-ink sm:text-5xl">
            {post.title}
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-soft">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {date}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock3 className="h-4 w-4" />
              {post.readTime}
            </span>
            <span className="flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <span key={tag} className="chip pixel-font !text-[14px]">
                  #{tag}
                </span>
              ))}
            </span>
          </div>
        </header>

        <div className="glass mt-10 rounded-4xl p-8 sm:p-10">
          <RichText
            content={post.body}
            className="text-base leading-8 text-ink-soft"
          />
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-4xl border border-black/5 bg-white/50 p-6 sm:flex-row sm:items-center">
          <p className="text-sm text-ink-soft">
            这篇笔记有收获？去博客里看看其他内容。
          </p>
          <Link href="/blog" className="pixel-btn rounded-full">
            全部文章
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </article>
    </div>
  );
}
