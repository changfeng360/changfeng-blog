"use client";

import { useState } from "react";
import { LogIn, Palette, Pencil, X } from "lucide-react";
import { useAdmin } from "./AdminContext";
import SiteStylePanel from "./SiteStylePanel";

export default function AdminFloating() {
  const { isAdmin, editMode, setEditMode, login, logout } = useAdmin();
  const [open, setOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isAdmin) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="fixed bottom-5 right-5 z-[70] flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-white/85 text-ink shadow-apple-hover backdrop-blur-xl dark:border-white/10 dark:bg-white/15 dark:text-white"
          aria-label="Admin"
        >
          <LogIn className="h-5 w-5" />
        </button>
        {open ? (
          <div className="fixed bottom-20 right-5 z-[70] w-72 rounded-4xl border border-white/60 bg-white/90 p-5 shadow-apple-hover backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/90">
            <input
              type="password"
              value={tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
              placeholder="Admin token"
              className="w-full rounded-2xl border border-white/60 bg-white/60 px-4 py-3 text-sm text-ink outline-none dark:border-white/10 dark:bg-white/10 dark:text-white"
            />
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                setError("");
                try {
                  const ok = await login(tokenInput);
                  if (!ok) {
                    setError("Invalid token");
                  } else {
                    setOpen(false);
                    setTokenInput("");
                  }
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Login failed");
                } finally {
                  setLoading(false);
                }
              }}
              className="pixel-btn mt-3 w-full justify-center rounded-full px-5 py-3"
            >
              <LogIn className="h-4 w-4" />
              {loading ? "Checking..." : "Enter"}
            </button>
            {error ? (
              <p className="mt-3 text-sm text-accent-pink">{error}</p>
            ) : null}
          </div>
        ) : null}
      </>
    );
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
