"use client";

import { useEffect, useState } from "react";
import AdminInlineEditor, {
  type AdminField,
} from "@/components/admin/AdminInlineEditor";
import { useAdmin } from "@/components/admin/AdminContext";

const fields: AdminField[] = [
  { name: "baseFontSize", label: "Base font size", type: "number" },
  { name: "headingItalic", label: "Italic headings", type: "checkbox" },
  { name: "accentColor", label: "Accent color", type: "color" },
  { name: "backgroundColor", label: "Light background", type: "color" },
  { name: "darkBackground", label: "Dark background", type: "color" },
];

export default function SiteStylePanel({
  onClose,
}: {
  onClose: () => void;
}) {
  const { api } = useAdmin();
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    api("data/site")
      .then((site) => setData(site as Record<string, unknown>))
      .catch(() => setData({}));
  }, [api]);

  if (!data) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-5 z-[70] w-[340px] max-w-[calc(100vw-2.5rem)]">
      <AdminInlineEditor
        title="Site style"
        fields={fields}
        data={data}
        onSave={async (site) => {
          const root = document.documentElement;
          root.style.setProperty(
            "--site-base-size",
            `${Number(site.baseFontSize) || 18}px`,
          );
          root.style.setProperty(
            "--site-accent",
            String(site.accentColor || "#0071e3"),
          );
          root.style.setProperty(
            "--site-bg",
            String(site.backgroundColor || "#f5f5f7"),
          );
          root.style.setProperty(
            "--site-dark-bg",
            String(site.darkBackground || "#0d0d0f"),
          );
          root.style.setProperty(
            "--site-heading-style",
            site.headingItalic ? "italic" : "normal",
          );
          await api("data/site", {
            method: "PUT",
            body: JSON.stringify(site),
          });
          onClose();
        }}
        onCancel={onClose}
      />
    </div>
  );
}
