"use client";

import { useState } from "react";
import { Palette, Pencil, X } from "lucide-react";
import { useAdmin } from "./AdminContext";
import SiteStylePanel from "./SiteStylePanel";

export default function AdminFloating() {
  const { isAdmin, editMode, setEditMode, logout } = useAdmin();
  const [styleOpen, setStyleOpen] = useState(false);

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      {editMode && styleOpen ? (
        <SiteStylePanel onClose={() => setStyleOpen(false)} />
      ) : null}
      <div className="fixed bottom-5 right-5 z-[70] flex flex-col items-end gap-2">
      {editMode ? (
        <button
          type="button"
          onClick={logout}
          className="flex h-10 items-center gap-2 rounded-full border border-white/60 bg-white/85 px-4 text-sm font-medium text-ink shadow-apple-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/15 dark:text-white"
        >
          <X className="h-4 w-4" />
          Sign out
        </button>
      ) : null}
      {editMode ? (
        <button
          type="button"
          onClick={() => setStyleOpen((value) => !value)}
          className="flex h-10 items-center gap-2 rounded-full border border-white/60 bg-white/85 px-4 text-sm font-medium text-ink shadow-apple-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/15 dark:text-white"
        >
          <Palette className="h-4 w-4" />
          Style
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => setEditMode(!editMode)}
        className="flex h-12 items-center gap-2 rounded-full border border-white/60 bg-white/85 px-4 text-sm font-medium text-ink shadow-apple-hover backdrop-blur-xl dark:border-white/10 dark:bg-white/15 dark:text-white"
      >
        {editMode ? <X className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
        {editMode ? "Done" : "Edit"}
      </button>
      </div>
    </>
  );
}
