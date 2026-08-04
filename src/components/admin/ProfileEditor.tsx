"use client";

import AdminInlineEditor, {
  type AdminField,
} from "@/components/admin/AdminInlineEditor";
import { useAdmin } from "@/components/admin/AdminContext";
import type { Profile } from "@/data/content";

const profileFields: AdminField[] = [
  { name: "name", label: "Name" },
  { name: "location", label: "Location" },
  { name: "coffee", label: "Detail" },
  { name: "aboutDescription", label: "Page description", type: "textarea" },
  { name: "tagline", label: "Intro", type: "textarea" },
  { name: "intro", label: "Home intro", type: "textarea" },
  { name: "email", label: "Email" },
  { name: "github", label: "GitHub URL" },
  { name: "bilibili", label: "Bilibili URL" },
  { name: "tags", label: "Tags", type: "array" },
  { name: "skills", label: "Skills JSON", type: "json" },
];

export default function ProfileEditor({
  profile,
  onSaved,
  onCancel,
}: {
  profile: Profile;
  onSaved: (profile: Profile) => void;
  onCancel: () => void;
}) {
  const { api } = useAdmin();

  const save = async (data: Record<string, unknown>) => {
    const parsed = {
      ...data,
      skills:
        typeof data.skills === "string"
          ? JSON.parse(data.skills)
          : data.skills,
    };
    await api("data/profile", {
      method: "PUT",
      body: JSON.stringify(parsed),
    });
    onSaved(parsed as Profile);
  };

  return (
    <AdminInlineEditor
      title="Edit profile"
      fields={profileFields}
      data={profile as unknown as Record<string, unknown>}
      onSave={save}
      onCancel={onCancel}
    />
  );
}
