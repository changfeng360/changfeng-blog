"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Globe,
  Home,
  Package,
  Star,
  UserRound,
} from "lucide-react";
import { SPRING_SOFT } from "@/lib/motion";

const items = [
  { href: "/", label: "首页", icon: Home },
  { href: "/blog", label: "文章", icon: Package },
  { href: "/projects", label: "项目", icon: Star },
  { href: "/about", label: "关于", icon: UserRound },
  { href: "/share", label: "分享", icon: Globe },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={SPRING_SOFT}
      layoutRoot
      className="fixed inset-x-0 top-4 z-50 flex justify-center px-4"
    >
      <nav className="glass-nav flex h-14 items-center gap-1 rounded-full px-2 sm:gap-2 sm:px-3">
        {items.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-ink-soft transition-colors duration-200 hover:text-ink sm:px-4"
              aria-current={isActive ? "page" : undefined}
            >
              {isActive ? (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full border border-white/60 bg-white/80 shadow-apple-sm"
                  transition={SPRING_SOFT}
                />
              ) : null}
              <Icon className="relative z-10 h-4 w-4" />
              <span className="relative z-10 hidden md:inline">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </motion.header>
  );
}
