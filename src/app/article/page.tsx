"use client";

import { useEffect, useState } from "react";
import ArticleView from "@/components/ArticleView";

export default function ReadPage() {
  const [slug, setSlug] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSlug(params.get("slug") || "");
  }, []);

  return (
    <ArticleView slug={slug} />
  );
}
