"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const items = [
  { href: "/", label: "首页", icon: Home },
  { href: "/blog", label: "文章", icon: Package },
  { href: "/projects", label: "项目", icon: Star },
  { href: "/about", label: "关于", icon: UserRound },
  { href: "/share", label: "分享", icon: Globe },
];

export default function Nav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement | null>(null);
  const [pill, setPill] = useState({ left: 0, width: 0 });
  const activeHref =
    items.find((item) =>
      item.href === "/"
        ? pathname === "/"
        : pathname.startsWith(item.href),
    )?.href ?? "/";

  useIsomorphicLayoutEffect(() => {
    const updatePill = () => {
      const link = navRef.current?.querySelector<HTMLAnchorElement>(
        `a[data-nav="${activeHref}"]`,
      );
      const nav = navRef.current;
      if (!link || !nav) {
        return;
      }

      const navRect = nav.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      setPill({
        left: linkRect.left - navRect.left,
        width: linkRect.width,
      });
    };

    updatePill();
    window.addEventListener("resize", updatePill);
    return () => window.removeEventListener("resize", updatePill);
  }, [activeHref]);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={SPRING_SOFT}
      className="fixed inset-x-0 top-4 z-50 flex justify-center px-4"
    >
      <nav
        ref={navRef}
        className="glass-nav relative flex h-14 items-center gap-1 rounded-full px-2 sm:gap-2 sm:px-3"
      >
        {pill.width > 0 ? (
          <motion.span
            initial={false}
            animate={{ x: pill.left, width: pill.width }}
            transition={SPRING_SOFT}
            className="absolute left-0 top-2 h-10 rounded-full border border-white/60 bg-white/80 shadow-apple-sm"
          />
        ) : null}
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
              data-nav={item.href}
              className="relative flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-ink-soft transition-colors duration-200 hover:text-ink sm:px-4"
              aria-current={isActive ? "page" : undefined}
            >
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
