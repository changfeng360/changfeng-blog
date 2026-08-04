"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Coffee,
  Mail,
  Package,
  Star,
  UserRound,
} from "lucide-react";
import LcdClock from "@/components/LcdClock";
import CuteCat from "@/components/CuteCat";
import MusicPlayer from "@/components/MusicPlayer";
import PixelAvatar from "@/components/PixelAvatar";
import PixelCalendar from "@/components/PixelCalendar";
import PostCard from "@/components/PostCard";
import { posts } from "@/data/content";
import { fadeUp, staggerContainer } from "@/lib/motion";

const quickLinks = [
  { href: "/blog", label: "近期文章", meta: "06 notes", icon: Package },
  { href: "/projects", label: "项目档案", meta: "06 builds", icon: Star },
  { href: "/about", label: "关于我", meta: "01 profile", icon: UserRound },
];

const nowList = [
  "重写个人博客的像素主题",
  "做一个能陪我写代码的小 Agent",
  "把 C++ 小引擎的渲染循环再压 5ms",
];

export default function HomePage() {
  const [emailCopied, setEmailCopied] = useState(false);

  const copyEmail = async () => {
    const email = "changfeng360@gmail.com";
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = email;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setEmailCopied(true);
    window.setTimeout(() => setEmailCopied(false), 1800);
  };

  return (
    <div className="px-5 pb-8 pt-28 sm:px-8 sm:pt-32">
      <section className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="chip pixel-font !text-[12px] text-accent-blue">
            01 // WELCOME
          </span>
          <h1 className="mt-5 font-serif text-4xl font-medium italic leading-[1.12] text-ink sm:text-5xl">
            Welcome to Changfeng’s blog
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
                这里是我的个人博客。记录代码、设计、Agent，以及一切让我想再多看一眼的小东西。
          </p>
        </motion.div>

        <motion.section
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:auto-rows-[minmax(240px,auto)] lg:grid-cols-3"
        >
          <motion.div
            variants={fadeUp}
            className="glass min-h-[480px] rounded-5xl p-6 sm:col-span-2 sm:row-span-2 sm:p-10"
          >
            <div className="flex h-full flex-col">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="shrink-0">
                  <MusicPlayer />
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="chip pixel-font !text-[12px]">
                      HELLO WORLD
                    </span>
                    <span className="mt-3 block text-lg font-medium text-ink-soft">
                      长风
                    </span>
                  </div>
                  <PixelAvatar
                    size={88}
                    className="h-16 w-16 sm:h-[88px] sm:w-[88px]"
                  />
                </div>
              </div>

              <p className="mt-6 max-w-full text-lg leading-relaxed text-ink sm:mt-8">
                你好，欢迎来到我的个人博客，我会在这里记录我的学习生活，分享一些有意思的内容。感兴趣的话可以从下方的渠道了解我<span className="whitespace-nowrap">哦~</span>
              </p>

              <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-6 sm:pt-8">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="https://github.com/changfeng360"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center gap-2.5 rounded-full bg-black px-4 text-sm font-semibold text-white shadow-apple-sm transition-transform duration-150 ease-out active:scale-95 hover:-translate-y-0.5"
                    aria-label="GitHub"
                  >
                    <Image
                      src="/pixels/github-icon.png"
                      alt="GitHub"
                      width={280}
                      height={280}
                      unoptimized
                      className="h-8 w-8 shrink-0 object-contain"
                    />
                    GitHub
                  </Link>
                  <Link
                    href="https://space.bilibili.com/1535776199?spm_id_from=333.1007.0.0"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center gap-2.5 rounded-full border border-black/10 bg-white px-4 text-sm font-semibold text-ink shadow-apple-sm transition-transform duration-150 ease-out active:scale-95 hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/10 dark:text-white"
                    aria-label="Bilibili"
                  >
                    <Image
                      src="/pixels/bilibili-icon.png"
                      alt="Bilibili"
                      width={512}
                      height={512}
                      unoptimized
                      className="h-8 w-8 shrink-0 object-contain"
                    />
                    Bilibili
                  </Link>
                  <button
                    type="button"
                    onClick={copyEmail}
                    className="icon-button group relative"
                    aria-label={
                      emailCopied
                        ? "邮箱已复制"
                        : "复制邮箱 changfeng360@gmail.com"
                    }
                  >
                    <Mail className="h-4 w-4" />
                    <span
                      className={`pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-full border border-black/5 bg-white/95 px-3 py-1.5 text-xs font-medium text-ink shadow-apple-hover transition-all duration-150 ${
                        emailCopied
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {emailCopied ? "已复制" : "changfeng360@gmail.com"}
                    </span>
                  </button>
                  <Link href="/about" className="chip ml-2 hover:bg-white">
                    查看关于
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <CuteCat className="h-20 w-auto sm:h-24" />
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="glass rounded-4xl">
            <div className="flex h-full flex-col p-6">
              <div className="flex items-center justify-between">
                <span className="chip pixel-font !text-[14px] text-accent-pink">
                  FEATURED
                </span>
                <span className="text-xs text-ink-soft">最新笔记</span>
              </div>
              <p className="mt-4 text-lg font-semibold leading-snug text-ink">
                {posts[0].title}
              </p>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">
                {posts[0].excerpt}
              </p>
              <Link
                href={`/blog/${posts[0].slug}`}
                className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-medium text-accent-blue"
              >
                阅读全文
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="glass h-full rounded-4xl">
            <LcdClock />
          </motion.div>

          <motion.div variants={fadeUp} className="glass h-full rounded-4xl">
            <PixelCalendar />
          </motion.div>

          <motion.div variants={fadeUp} className="glass rounded-4xl">
            <div className="flex h-full flex-col p-6">
              <span className="chip pixel-font !text-[14px] text-accent-blue">
                QUICK LINKS
              </span>
              <div className="mt-4 grid gap-2">
                {quickLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="group flex items-center gap-3 rounded-2xl border border-white/60 bg-white/45 p-3 shadow-apple-sm backdrop-blur-xl transition-transform duration-200 ease-out hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/10"
                    >
                      <Icon className="h-4 w-4 text-ink-soft" />
                      <span className="text-sm font-medium text-ink">
                        {link.label}
                      </span>
                      <span className="pixel-font ml-auto text-[14px] text-ink-soft">
                        {link.meta}
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-ink-soft transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="glass rounded-4xl">
            <div className="flex h-full flex-col p-6">
              <div className="flex items-center justify-between">
                <span className="chip pixel-font !text-[14px] text-accent-mint">
                  NOW
                </span>
                <Coffee className="h-4 w-4 text-ink-soft" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-ink">
                最近在做
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-ink-soft">
                {nowList.map((item, index) => (
                  <li key={item} className="flex gap-2">
                    <span className="pixel-font text-[14px] text-accent-pink">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="pixel-font mt-auto pt-5 text-[14px] text-ink-soft">
                STATUS: BUILDING / HAPPY
              </div>
            </div>
          </motion.div>
        </motion.section>

        <motion.section
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-20"
        >
          <div className="mb-6 flex items-end justify-between">
            <div>
              <span className="chip pixel-font !text-[12px] text-accent-tangerine">
                02 // LATEST
              </span>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                最新文章
              </h2>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-sm font-medium text-accent-blue"
            >
              全部文章
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.slice(1, 4).map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </motion.section>
      </section>
    </div>
  );
}
