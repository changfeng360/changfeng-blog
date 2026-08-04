import HomePage from "@/components/HomePage";
import { getAllPosts } from "@/lib/posts";
import { getProfile } from "@/lib/profile";

export default function Page() {
  return <HomePage posts={getAllPosts()} profile={getProfile()} />;
}
