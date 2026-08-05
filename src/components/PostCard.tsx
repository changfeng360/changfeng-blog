"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Clock3 } from "lucide-react";
import RichText from "@/components/RichText";
import type { Post } from "@/data/content";
import { fadeUp, SPRING_SOFT } from "@/lib/motion";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}

export default function PostCard({ post }: { post: Post }) {
  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      transition={SPRING_SOFT}
      className="card-hover glass rounded-4xl"
    >
      <Link href={`/blog/${post.slug}`} className="block p-6 sm:p-7">
        <div className="flex items-center justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/5 bg-white/70 text-lg shadow-apple-sm">
            {post.emoji}
          </span>
          <ArrowUpRight className="h-5 w-5 text-ink-soft transition-transform duration-300 ease-out group-hover:translate-x-1 group-hover:-translate-y-1" />
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <span key={tag} className="chip pixel-font !text-[14px]">
              #{tag}
            </span>
          ))}
        </div>

        <h3 className="mt-4 text-xl font-semibold leading-snug tracking-tight text-ink">
          {post.title}
        </h3>
        <RichText
          content={post.excerpt}
          className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft"
        />

        <div className="mt-5 flex items-center gap-3 text-xs text-ink-soft">
          <span>{formatDate(post.date)}</span>
          <span className="flex items-center gap-1">
            <Clock3 className="h-3.5 w-3.5" />
            {post.readTime}
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
