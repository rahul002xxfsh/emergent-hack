"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface Testimonial {
  quote: string;
  name: string;
  designation: string;
  src: string;
}
interface Colors {
  name?: string;
  designation?: string;
  testimony?: string;
  arrowBackground?: string;
  arrowForeground?: string;
  arrowHoverBackground?: string;
}
interface FontSizes {
  name?: string;
  designation?: string;
  quote?: string;
}
interface CircularTestimonialsProps {
  testimonials: Testimonial[];
  autoplay?: boolean;
  colors?: Colors;
  fontSizes?: FontSizes;
  /** Called whenever the active card changes (used to select a persona). */
  onChange?: (index: number) => void;
  /** Optional slot rendered under the quote (e.g. a "Start session" button). */
  footer?: React.ReactNode;
  /** Stack the photos above the text (for narrow columns). */
  stacked?: boolean;
}

function calculateGap(width: number) {
  if (width < 360) return Math.round(width * 0.14);
  const minWidth = 1024, maxWidth = 1456, minGap = 60, maxGap = 86;
  if (width <= minWidth) return minGap;
  if (width >= maxWidth) return Math.max(minGap, maxGap + 0.06018 * (width - maxWidth));
  return minGap + (maxGap - minGap) * ((width - minWidth) / (maxWidth - minWidth));
}

export const CircularTestimonials = ({
  testimonials,
  autoplay = true,
  colors = {},
  fontSizes = {},
  onChange,
  footer,
  stacked = false,
}: CircularTestimonialsProps) => {
  const colorName = colors.name ?? "#000";
  const colorDesignation = colors.designation ?? "#6b7280";
  const colorTestimony = colors.testimony ?? "#4b5563";
  const colorArrowBg = colors.arrowBackground ?? "#141414";
  const colorArrowFg = colors.arrowForeground ?? "#f1f1f7";
  const colorArrowHoverBg = colors.arrowHoverBackground ?? "#00a6fb";
  const fontSizeName = fontSizes.name ?? "1.5rem";
  const fontSizeDesignation = fontSizes.designation ?? "0.925rem";
  const fontSizeQuote = fontSizes.quote ?? "1.125rem";

  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverPrev, setHoverPrev] = useState(false);
  const [hoverNext, setHoverNext] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1200);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const autoplayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const testimonialsLength = useMemo(() => testimonials.length, [testimonials]);
  const activeTestimonial = useMemo(() => testimonials[activeIndex], [activeIndex, testimonials]);

  useEffect(() => {
    onChange?.(activeIndex);
  }, [activeIndex, onChange]);

  useEffect(() => {
    function handleResize() {
      if (imageContainerRef.current) setContainerWidth(imageContainerRef.current.offsetWidth);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (autoplay) {
      autoplayIntervalRef.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % testimonialsLength);
      }, 5000);
    }
    return () => {
      if (autoplayIntervalRef.current) clearInterval(autoplayIntervalRef.current);
    };
  }, [autoplay, testimonialsLength]);

  const stopAutoplay = () => {
    if (autoplayIntervalRef.current) clearInterval(autoplayIntervalRef.current);
  };

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % testimonialsLength);
    stopAutoplay();
  }, [testimonialsLength]);
  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + testimonialsLength) % testimonialsLength);
    stopAutoplay();
  }, [testimonialsLength]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey || (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)))) return;
      const box = imageContainerRef.current?.getBoundingClientRect();
      if (!box || box.bottom < 0 || box.top > window.innerHeight) return; // only when the picker is on screen
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handlePrev, handleNext]);

  function getImageStyle(index: number): React.CSSProperties {
    const gap = calculateGap(containerWidth);
    const maxStickUp = gap * 0.8;
    const isActive = index === activeIndex;
    const isLeft = (activeIndex - 1 + testimonialsLength) % testimonialsLength === index;
    const isRight = (activeIndex + 1) % testimonialsLength === index;
    const base: React.CSSProperties = { transition: "transform 0.5s cubic-bezier(0.22,1,0.36,1), opacity 0.4s ease", willChange: "transform, opacity" };
    if (isActive) return { ...base, zIndex: 3, opacity: 1, pointerEvents: "auto", transform: "translateX(0px) translateY(0px) scale(1) rotateY(0deg)" };
    if (isLeft) return { ...base, zIndex: 2, opacity: 1, pointerEvents: "auto", transform: `translateX(-${gap}px) translateY(-${maxStickUp}px) scale(0.85) rotateY(15deg)` };
    if (isRight) return { ...base, zIndex: 2, opacity: 1, pointerEvents: "auto", transform: `translateX(${gap}px) translateY(-${maxStickUp}px) scale(0.85) rotateY(-15deg)` };
    return { ...base, zIndex: 1, opacity: 0, pointerEvents: "none" };
  }

  const quoteVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div className={stacked ? "w-full px-2 pb-2 pt-8" : "w-full max-w-4xl px-2 pb-4 pt-10 md:p-8"}>
      <div className={stacked ? "grid gap-10" : "grid gap-12 md:grid-cols-2 md:gap-20"}>
        <div
          className={stacked ? "relative mx-auto h-72 w-full max-w-[240px] [perspective:1000px]" : "relative mx-auto h-80 w-full max-w-[280px] [perspective:1000px] md:h-96 md:max-w-none"}
          ref={imageContainerRef}
        >
          {testimonials.map((t, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={t.src}
              src={t.src}
              alt={t.name}
              onClick={() => { setActiveIndex(index); stopAutoplay(); }}
              className="absolute h-full w-full cursor-pointer select-none rounded-3xl object-cover object-top shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
              draggable={false}
              decoding="async"
              style={getImageStyle(index)}
            />
          ))}
        </div>
        <div className="flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div key={activeIndex} variants={quoteVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.18, ease: "easeOut" }}>
              <h3 className="mb-1 font-bold" style={{ color: colorName, fontSize: fontSizeName }}>{activeTestimonial.name}</h3>
              <p className="mb-8" style={{ color: colorDesignation, fontSize: fontSizeDesignation }}>{activeTestimonial.designation}</p>
              <motion.p className="leading-relaxed" style={{ color: colorTestimony, fontSize: fontSizeQuote }}>
                {activeTestimonial.quote.split(" ").map((word, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.16, ease: "easeOut", delay: Math.min(0.012 * i, 0.3) }}
                    style={{ display: "inline-block" }}
                  >
                    {word}&nbsp;
                  </motion.span>
                ))}
              </motion.p>
            </motion.div>
          </AnimatePresence>
          <div className="mt-6 flex gap-4">
            <button
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-none transition-colors"
              onClick={handlePrev}
              style={{ backgroundColor: hoverPrev ? colorArrowHoverBg : colorArrowBg }}
              onMouseEnter={() => setHoverPrev(true)}
              onMouseLeave={() => setHoverPrev(false)}
              aria-label="Previous persona"
            >
              <ArrowLeft size={24} color={colorArrowFg} />
            </button>
            <button
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-none transition-colors"
              onClick={handleNext}
              style={{ backgroundColor: hoverNext ? colorArrowHoverBg : colorArrowBg }}
              onMouseEnter={() => setHoverNext(true)}
              onMouseLeave={() => setHoverNext(false)}
              aria-label="Next persona"
            >
              <ArrowRight size={24} color={colorArrowFg} />
            </button>
          </div>
          {footer && <div className="mt-8 border-t border-white/10 pt-6">{footer}</div>}
        </div>
      </div>
    </div>
  );
};

export default CircularTestimonials;
