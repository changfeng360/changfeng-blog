import AboutPageContent from "@/components/AboutPageContent";
import { getProfile } from "@/lib/profile";

export default function AboutPage() {
  return <AboutPageContent profile={getProfile()} />;
}
