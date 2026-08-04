"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import ProjectCard from "@/components/ProjectCard";
import type { Project } from "@/data/content";
import { staggerContainer } from "@/lib/motion";
import projectsJson from "../../../content/projects.json";

const projects = projectsJson as Project[];

export default function ProjectsPage() {
  const allTags = useMemo(
    () => Array.from(new Set(projects.flatMap((project) => project.stack))),
    [],
  );
  const [activeTag, setActiveTag] = useState("全部");

  const visible = useMemo(
    () =>
      activeTag === "全部"
        ? projects
        : projects.filter((project) => project.stack.includes(activeTag)),
    [activeTag],
  );

  return (
    <div className="pb-8">
      <PageHeader
        eyebrow="03 // BUILDS"
        title="我的项目"
        description="从像素终端到 Agent 编排台，每一个项目都是我把好奇心编译成可运行版本的证据。"
      />

      <div className="mx-auto mt-10 max-w-5xl px-5 sm:px-8">
        <div className="flex flex-wrap gap-2">
          {["全部", ...allTags].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag(tag)}
              className={`chip transition-transform duration-150 ease-out active:scale-95 ${
                activeTag === tag
                  ? "border-pixel-ink bg-pixel-cream text-pixel-ink shadow-pixel-sm"
                  : "hover:bg-white"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {visible.map((project) => (
            <ProjectCard key={project.name} project={project} />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
