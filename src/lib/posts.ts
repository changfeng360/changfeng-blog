import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Post } from "@/data/content";

export type PostWithBody = Post & {
  body: string;
};

const postsDirectory = path.join(process.cwd(), "content", "posts");

function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeDate(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value ?? "").slice(0, 10);
}

function readPost(filePath: string): PostWithBody | null {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  if (!data.slug || !data.title) {
    return null;
  }

  return {
    slug: String(data.slug),
    title: String(data.title),
    excerpt: String(data.excerpt ?? data.description ?? ""),
    date: normalizeDate(data.date),
    tags: normalizeTags(data.tags),
    readTime: String(data.readTime ?? "5 min"),
    emoji: String(data.emoji ?? "📝"),
    featured: Boolean(data.featured),
    body: content.trim(),
  };
}

export function getAllPosts(): PostWithBody[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  return fs
    .readdirSync(postsDirectory)
    .filter((file) => /\.(md|mdx)$/.test(file))
    .map((file) => readPost(path.join(postsDirectory, file)))
    .filter((post): post is PostWithBody => post !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostSlugs(): string[] {
  return getAllPosts().map((post) => post.slug);
}

export function getPostBySlug(slug: string): PostWithBody | null {
  return getAllPosts().find((post) => post.slug === slug) ?? null;
}
