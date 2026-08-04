import BlogTimeline from "./BlogTimeline";
import { getAllPosts } from "@/lib/posts";

export default function BlogPage() {
  return <BlogTimeline posts={getAllPosts()} />;
}
