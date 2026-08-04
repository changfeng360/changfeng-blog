import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarDays, Clock3 } from "lucide-react";
import { getAllPosts, getPostBySlug } from "@/lib/posts";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  return {
    title: post ? `${post.title} | Pixel 博客` : "Pixel 博客",
    description: post?.excerpt,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const date = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(post.date));

  const sections = [
    {
      title: "为什么写这篇",
      body: post.excerpt,
    },
    {
      title: "过程中的取舍",
      body: `这篇笔记围绕 ${post.tags.join("、")} 展开。真正落地的过程通常比结论更有意思：哪些方案被推倒、哪些细节反复调整、哪些瞬间让人觉得一切都值得。`,
    },
    {
      title: "下一步",
      body: "继续把想法编译成可以运行的东西，然后回来记录。也欢迎你在评论区或邮件里告诉我你的做法。",
    },
  ];

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
          {sections.map((section) => (
            <section key={section.title} className="mb-8 last:mb-0">
              <h2 className="text-xl font-semibold tracking-tight text-ink">
                {section.title}
              </h2>
              <p className="mt-3 text-base leading-8 text-ink-soft">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-4xl border border-black/5 bg-white/50 p-6 sm:flex-row sm:items-center">
          <p className="text-sm text-ink-soft">这篇笔记有收获？去博客里看看其他内容。</p>
          <Link
            href="/blog"
            className="pixel-btn rounded-full"
          >
            全部文章
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </article>
    </div>
  );
}
