"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Coffee,
  Compass,
  Cpu,
  MapPin,
  Palette,
  Pencil,
  Sparkles,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import PixelAvatar from "@/components/PixelAvatar";
import ProfileEditor from "@/components/admin/ProfileEditor";
import { useAdmin } from "@/components/admin/AdminContext";
import type { Profile } from "@/data/content";
import { fadeUp, staggerContainer } from "@/lib/motion";

const principles = [
  {
    icon: Compass,
    title: "克制",
    body: "先想清楚不做什么。让每个元素都有理由留在页面上。",
    accent: "text-accent-blue",
  },
  {
    icon: Sparkles,
    title: "细节",
    body: "一像素的呼吸感、一句文案的节奏，加起来就是手感。",
    accent: "text-accent-pink",
  },
  {
    icon: Cpu,
    title: "玩乐",
    body: "严肃地做正经事，也认真地在角落放一只像素猫。",
    accent: "text-accent-mint",
  },
];

export default function AboutPageContent({
  profile,
}: {
  profile: Profile;
}) {
  const { editMode } = useAdmin();
  const [current, setCurrent] = useState(profile);
  const [editing, setEditing] = useState(false);

  return (
    <div className="pb-8">
      <PageHeader
        eyebrow="04 // PROFILE"
        title="关于我"
        description={current.aboutDescription}
      />

      <motion.section
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mx-auto mt-12 max-w-5xl px-5 sm:px-8"
      >
        <motion.div
          variants={fadeUp}
          className="glass rounded-5xl p-8 sm:p-10"
        >
          {editing ? (
            <ProfileEditor
              profile={current}
              onSaved={(profile) => {
                setCurrent(profile);
                setEditing(false);
              }}
              onCancel={() => setEditing(false)}
            />
          ) : null}
          <div className="flex flex-col gap-8 md:flex-row md:items-start">
            <div className="shrink-0">
              <PixelAvatar
                size={128}
                className="h-24 w-24 sm:h-32 sm:w-32"
              />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold tracking-tight text-ink">
                  {current.name}
                </h2>
                {editMode ? (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="icon-button !h-9 !w-9"
                    aria-label="Edit profile"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {current.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Coffee className="h-4 w-4" />
                  {current.coffee}
                </span>
              </div>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink">
                {current.tagline}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {current.tags.map(
                  (tag) => (
                    <span key={tag} className="chip pixel-font !text-[14px]">
                      #{tag}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-5 grid gap-5 lg:grid-cols-5">
          <motion.div
            variants={fadeUp}
            className="glass rounded-4xl p-7 lg:col-span-3"
          >
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-accent-lilac" />
              <h3 className="text-lg font-semibold text-ink">技能雷达</h3>
            </div>
            <div className="mt-6 space-y-5">
              {current.skills.map((skill) => (
                <div key={skill.name}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-ink">{skill.name}</span>
                    <span className="pixel-font text-[12px] text-ink-soft">
                      {skill.level}%
                    </span>
                  </div>
                  <div className="h-3 border-2 border-pixel-ink bg-white/70 p-[2px] shadow-pixel-sm">
                    <div
                      className="h-full bg-accent-mint"
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="glass rounded-4xl p-7 lg:col-span-2"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent-tangerine" />
              <h3 className="text-lg font-semibold text-ink">我的原则</h3>
            </div>
            <div className="mt-6 space-y-4">
              {principles.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex gap-3 rounded-2xl border border-white/60 bg-white/45 p-4 shadow-apple-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/10"
                  >
                    <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${item.accent}`} />
                    <div>
                      <p className="font-semibold text-ink">{item.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                        {item.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        <motion.div variants={fadeUp} className="glass mt-5 rounded-4xl p-8">
          <div className="flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
            <div>
              <span className="chip pixel-font !text-[14px] text-accent-pink">
                OPEN TO
              </span>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
                一起做点有意思的东西
              </h3>
              <p className="mt-2 text-sm text-ink-soft">
                项目合作、写作交流、技术咨询，都欢迎从一封邮件开始。
              </p>
            </div>
            <Link
              href="mailto:changfeng360@gmail.com"
              className="pixel-btn shrink-0 rounded-full px-6 py-3"
            >
              写封邮件
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </motion.section>
    </div>
  );
}
