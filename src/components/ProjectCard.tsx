"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Github, Pencil } from "lucide-react";
import AdminInlineEditor, {
  type AdminField,
} from "@/components/admin/AdminInlineEditor";
import { useAdmin } from "@/components/admin/AdminContext";
import RichText from "@/components/RichText";
import type { Project } from "@/data/content";
import { fadeUp, SPRING_SOFT } from "@/lib/motion";

const accentStyles: Record<string, string> = {
  mint: "bg-emerald-100 text-emerald-700",
  blue: "bg-sky-100 text-sky-700",
  tangerine: "bg-amber-100 text-amber-700",
  pink: "bg-rose-100 text-rose-700",
  lilac: "bg-violet-100 text-violet-700",
  gold: "bg-yellow-100 text-yellow-700",
};

export default function ProjectCard({
  project,
  onSave,
}: {
  project: Project;
  onSave?: (project: Project) => Promise<void>;
}) {
  const { editMode } = useAdmin();
  const [editing, setEditing] = useState(false);

  const fields: AdminField[] = [
    { name: "name", label: "Name" },
    { name: "year", label: "Year" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "stack", label: "Stack", type: "array" },
    { name: "icon", label: "Icon" },
    { name: "accent", label: "Accent" },
    { name: "github", label: "GitHub URL" },
    { name: "website", label: "Website URL" },
  ];

  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      transition={SPRING_SOFT}
      className="card-hover glass rounded-4xl"
    >
      <div className="flex h-full flex-col p-6 sm:p-7">
        {editing ? (
          <AdminInlineEditor
            title={`Edit ${project.name}`}
            fields={fields}
            data={project as unknown as Record<string, unknown>}
            onSave={async (data) => {
              await onSave?.(data as unknown as Project);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        ) : null}
        <div className="flex items-start justify-between gap-4">
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-black/5 font-mono text-lg font-bold shadow-apple-sm ${accentStyles[project.accent] ?? "bg-white text-ink"}`}
          >
            {project.icon}
          </span>
          <div className="flex gap-1">
            {editMode ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="icon-button !h-9 !w-9"
                aria-label={`Edit ${project.name}`}
              >
                <Pencil className="h-4 w-4" />
              </button>
            ) : null}
            <Link
              href={project.github}
              target="_blank"
              rel="noreferrer"
              className="icon-button !h-9 !w-9"
              aria-label={`${project.name} GitHub`}
            >
              <Github className="h-4 w-4" />
            </Link>
            <Link
              href={project.website}
              className="icon-button !h-9 !w-9"
              aria-label={`${project.name} 网站`}
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-6 flex items-baseline gap-3">
          <h3 className="text-xl font-semibold tracking-tight text-ink">
            {project.name}
          </h3>
          <span className="pixel-font text-[14px] text-ink-soft">
            {project.year}
          </span>
        </div>
        <RichText
          content={project.description}
          className="mt-2 text-sm leading-relaxed text-ink-soft"
        />

        <div className="mt-auto flex flex-wrap gap-1.5 pt-6">
          {project.stack.map((tech) => (
            <span key={tech} className="chip pixel-font !text-[14px]">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}
