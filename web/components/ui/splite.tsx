'use client'

import { Suspense, lazy, memo, useEffect, useRef, useState } from "react";
import type { Application } from "@splinetool/runtime";
import { cn } from "@/lib/utils";
const Spline = lazy(() => import("@splinetool/react-spline"));

interface SplineSceneProps {
  scene: string;
  className?: string;
}

/**
 * Loads the heavy 3D runtime only when the scene is about to scroll into view,
 * and pauses rendering whenever it is off screen or the tab is hidden.
 */
export const SplineScene = memo(function SplineScene({ scene, className }: SplineSceneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const onScreenRef = useRef(false);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const sync = () => {
    const app = appRef.current;
    if (!app) return;
    const shouldPlay = onScreenRef.current && document.visibilityState === "visible";
    if (shouldPlay && app.isStopped) app.play();
    else if (!shouldPlay && !app.isStopped) app.stop();
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Start loading a little before it scrolls in
    const preload = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          preload.disconnect();
        }
      },
      { rootMargin: "600px" }
    );
    // Play only while actually on screen
    const playObs = new IntersectionObserver(([entry]) => {
      onScreenRef.current = entry.isIntersecting;
      sync();
    });
    preload.observe(el);
    playObs.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      preload.disconnect();
      playObs.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <div ref={ref} className="relative h-full w-full">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        </div>
      )}
      {visible && (
        <Suspense fallback={null}>
          <Spline
            scene={scene}
            onLoad={(app: Application) => {
              appRef.current = app;
              setLoaded(true);
              sync();
            }}
            className={cn(className, "transition-opacity duration-500", loaded ? "opacity-100" : "opacity-0")}
          />
        </Suspense>
      )}
    </div>
  );
});
