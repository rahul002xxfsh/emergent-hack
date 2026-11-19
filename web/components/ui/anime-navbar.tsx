"use client";

import * as React from "react";
import { motion, useScroll, useSpring, LayoutGroup } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  url: string;
  href?: string;
  icon: LucideIcon;
}

interface NavBarProps {
  items: NavItem[];
  className?: string;
  defaultActive?: string;
  /** Controlled active item (e.g. from scroll position). */
  active?: string;
  /** Called when an item is clicked. Return true to prevent default navigation. */
  onSelect?: (item: NavItem) => boolean | void;
  /** Accent colour for the active pill, mascot glow and progress line. */
  accent?: string;
}

// One shared spring so pill, mascot and hover all move as a single, fluid gesture.
const SPRING = { type: "spring", stiffness: 380, damping: 32, mass: 0.7 } as const;

export function AnimeNavBar({ items, className, defaultActive = "Home", active, onSelect, accent = "#ffffff" }: NavBarProps) {
  const [hovered, setHovered] = React.useState<string | null>(null);
  const [internalActive, setInternalActive] = React.useState<string>(defaultActive);
  const [hop, setHop] = React.useState(0); // increments on every click to replay the mascot hop
  const activeTab = active ?? internalActive;

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });

  return (
    <div className={cn("pointer-events-none fixed left-0 right-0 top-7 z-[9999] flex justify-center px-3 md:top-8", className)}>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...SPRING, delay: 0.1 }}
        className="pointer-events-auto relative flex items-center gap-1 overflow-visible rounded-full border border-white/10 bg-black/75 p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md md:gap-1.5"
        aria-label="Main"
        onMouseLeave={() => setHovered(null)}
      >
        <LayoutGroup id="anime-nav">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;
            const isHovered = hovered === item.name;
            return (
              <a
                key={item.name}
                href={item.href ?? item.url}
                onClick={(e) => {
                  setInternalActive(item.name);
                  setHop((h) => h + 1);
                  if (onSelect?.(item)) e.preventDefault();
                }}
                onMouseEnter={() => setHovered(item.name)}
                onFocus={() => setHovered(item.name)}
                onBlur={() => setHovered(null)}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.name}
                className={cn(
                  "relative flex select-none items-center gap-2 rounded-full px-3.5 py-2.5 text-sm font-semibold outline-none transition-colors duration-200 sm:px-4 md:px-5",
                  "focus-visible:ring-2 focus-visible:ring-white/40",
                  isActive ? "text-white" : "text-white/60 hover:text-white"
                )}
              >
                {/* Hover preview pill (glides between items) */}
                {isHovered && !isActive && (
                  <motion.span
                    layoutId="anime-nav-hover"
                    className="absolute inset-0 -z-10 rounded-full bg-white/[0.07]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={SPRING}
                  />
                )}

                {/* Active pill */}
                {isActive && (
                  <motion.span
                    layoutId="anime-nav-pill"
                    className="absolute inset-0 -z-10 rounded-full"
                    style={{ background: `${accent}2e`, boxShadow: `0 0 20px ${accent}45, inset 0 0 0 1px ${accent}66` }}
                    transition={SPRING}
                  />
                )}

                {/* Mascot that hops along to the active tab */}
                {isActive && (
                  <motion.span
                    layoutId="anime-nav-mascot"
                    className="pointer-events-none absolute -top-[22px] left-1/2 -ml-3.5"
                    transition={{ ...SPRING, stiffness: 320, damping: 26 }}
                    aria-hidden
                  >
                    <motion.span
                      key={hop}
                      className="relative block h-7 w-7"
                      initial={hop ? { y: -8, scale: 0.9 } : false}
                      animate={{ y: 0, scale: isHovered ? 1.1 : 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 14 }}
                    >
                      <span className="nav-bob absolute inset-0">
                        <span className="absolute inset-0 rounded-full bg-white" style={{ boxShadow: `0 0 14px ${accent}` }} />
                        <span className="nav-blink absolute left-[7px] top-[10px] h-[5px] w-[4px] rounded-full bg-black" />
                        <span className="nav-blink absolute right-[7px] top-[10px] h-[5px] w-[4px] rounded-full bg-black" />
                        <span className="absolute left-[4px] top-[15px] h-[3px] w-[4px] rounded-full bg-pink-300/80" />
                        <span className="absolute right-[4px] top-[15px] h-[3px] w-[4px] rounded-full bg-pink-300/80" />
                        <span
                          className={cn(
                            "absolute left-1/2 top-[17px] -translate-x-1/2 rounded-b-full border-b-2 border-black transition-all duration-200",
                            isHovered ? "h-[5px] w-[10px]" : "h-[3px] w-[7px]"
                          )}
                        />
                      </span>
                    </motion.span>
                  </motion.span>
                )}

                <Icon className="h-[18px] w-[18px] sm:hidden" strokeWidth={2.4} />
                <span className="hidden sm:inline">{item.name}</span>
              </a>
            );
          })}
        </LayoutGroup>

        {/* Page progress line */}
        <span className="pointer-events-none absolute inset-x-5 -bottom-px h-[2px] overflow-hidden rounded-full" aria-hidden>
          <motion.span
            className="block h-full w-full origin-left rounded-full"
            style={{ scaleX: progress, background: `linear-gradient(90deg, transparent, ${accent})` }}
          />
        </span>
      </motion.nav>
    </div>
  );
}

export default AnimeNavBar;
