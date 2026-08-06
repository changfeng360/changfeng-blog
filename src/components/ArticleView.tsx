"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  MessageSquare,
  Send,
  ThumbsUp,
} from "lucide-react";
import RichText from "@/components/RichText";
import type { Post } from "@/data/content";
import { useRuntimeContent } from "@/lib/useRuntimeContent";

type ArticlePost = Post & { body: string };

type ArticleComment = {
  id: string;
  nickname: string;
  content: string;
  createdAt: string;
};

type ArticleReaction = {
  likes: number;
  adminLiked: boolean;
  comments: ArticleComment[];
};

export default function ArticleView({
  slug,
  initialPost,
}: {
  slug: string;
  initialPost?: ArticlePost;
}) {
  const [post, setPost] = useState<ArticlePost | null>(initialPost ?? null);
  const [reaction, setReaction] = useState<ArticleReaction>({
    likes: 0,
    adminLiked: false,
    comments: [],
  });
  const [liked, setLiked] = useState(false);
  const [commentNickname, setCommentNickname] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentError, setCommentError] = useState("");
  const { content: runtime, loading } = useRuntimeContent();

  useEffect(() => {
    if (runtime.posts) {
      const next = runtime.posts.find((item) => item.slug === slug);
      setPost(next ?? null);
    }
  }, [runtime, loading, slug]);

  useEffect(() => {
    if (!slug) {
      return;
    }
    let active = true;
    setLiked(
      window.localStorage.getItem(`changfeng-post-liked-${slug}`) === "1",
    );
    fetch(`/api/post-reactions?slug=${encodeURIComponent(slug)}`)
      .then((response) => response.json().catch(() => ({})))
      .then((data: ArticleReaction) => {
        if (active && data && typeof data.likes === "number") {
          setReaction(data);
        }
      })
      .catch(() => {
        // Keep the default reaction state when the API is unavailable.
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="px-5 pb-8 pt-40 text-center sm:px-8">
        <p className="text-sm text-ink-soft">内容加载中...</p>
      </div>
    );
  }

  async function likePost() {
    if (liked || !slug) {
      return;
    }
    try {
      const response = await fetch("/api/post-reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, action: "like" }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "点赞失败");
      }
      setReaction(data);
      setLiked(true);
      window.localStorage.setItem(`changfeng-post-liked-${slug}`, "1");
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : "点赞失败");
    }
  }

  async function submitComment() {
    if (!slug || commentBusy) {
      return;
    }
    setCommentError("");
    if (!commentNickname.trim()) {
      setCommentError("请输入昵称");
      return;
    }
    if (!commentContent.trim()) {
      setCommentError("请输入评论内容");
      return;
    }
    setCommentBusy(true);
    try {
      const response = await fetch("/api/post-reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          action: "comment",
          nickname: commentNickname,
          content: commentContent,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "评论失败");
      }
      setReaction(data);
      setCommentNickname("");
      setCommentContent("");
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : "评论失败");
    } finally {
      setCommentBusy(false);
    }
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

        <section className="glass mt-8 rounded-4xl p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-accent-blue" />
              <h2 className="text-xl font-semibold tracking-tight text-ink">
                评论
              </h2>
              {reaction.adminLiked ? (
                <span className="chip pixel-font !text-[11px] text-accent-gold">
                  博主赞了
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={likePost}
              disabled={liked}
              className={`chip transition-transform duration-150 ease-out active:scale-95 ${
                liked
                  ? "border-pixel-ink bg-pixel-cream text-pixel-ink shadow-pixel-sm"
                  : "hover:bg-white"
              }`}
            >
              <ThumbsUp
                className={`h-3.5 w-3.5 ${
                  liked ? "fill-pixel-ink" : ""
                }`}
              />
              {reaction.likes || 0}
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {reaction.comments.length > 0 ? (
              reaction.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-3xl border border-white/60 bg-white/45 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/10"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">
                      {comment.nickname}
                    </span>
                    <span className="text-xs text-ink-soft">
                      {new Intl.DateTimeFormat("zh-CN", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(comment.createdAt))}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
                    {comment.content}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink-soft">还没有评论，来抢沙发吧</p>
            )}
          </div>

          <div className="mt-7 space-y-3">
            <input
              type="text"
              value={commentNickname}
              onChange={(event) => setCommentNickname(event.target.value)}
              placeholder="昵称"
              maxLength={30}
              className="w-full rounded-2xl border border-white/60 bg-white/55 px-4 py-3 text-sm text-ink outline-none backdrop-blur-xl placeholder:text-ink-faint focus:border-accent-blue/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
            />
            <textarea
              value={commentContent}
              onChange={(event) => setCommentContent(event.target.value)}
              placeholder="写下你的评论..."
              maxLength={1000}
              rows={4}
              className="w-full resize-y rounded-2xl border border-white/60 bg-white/55 px-4 py-3 text-sm text-ink outline-none backdrop-blur-xl placeholder:text-ink-faint focus:border-accent-blue/60 dark:border-white/10 dark:bg-white/10 dark:text-white"
            />
            {commentError ? (
              <p className="text-sm text-accent-pink">{commentError}</p>
            ) : null}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={submitComment}
                disabled={commentBusy}
                className="pixel-btn rounded-full px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {commentBusy ? "Sending" : "发表评论"}
              </button>
            </div>
          </div>
        </section>

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
