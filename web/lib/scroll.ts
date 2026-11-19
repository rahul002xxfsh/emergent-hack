// Eased, interruptible smooth scrolling (more fluent and consistent than native smooth scroll).

export const NAV_OFFSET = 96;

let rafId: number | null = null;
let cleanupInput: (() => void) | null = null;

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function stop() {
  if (rafId !== null) cancelAnimationFrame(rafId);
  rafId = null;
  cleanupInput?.();
  cleanupInput = null;
}

export function smoothScrollTo(target: number | (() => number), onDone?: () => void) {
  stop();
  const startY = window.scrollY;
  const resolve = () => {
    const maxY = document.documentElement.scrollHeight - window.innerHeight;
    const y = typeof target === "function" ? target() : target;
    return Math.max(0, Math.min(y, maxY));
  };
  const endY = resolve();
  const distance = endY - startY;
  if (Math.abs(distance) < 2) {
    onDone?.();
    return;
  }
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Duration scales with distance but stays snappy: 450ms to 950ms.
  const duration = reduced ? 0 : Math.min(950, Math.max(450, Math.abs(distance) * 0.28));

  // Any user scroll input cancels the animation so it never fights the user.
  const cancel = () => {
    stop();
    onDone?.();
  };
  const opts: AddEventListenerOptions = { passive: true, once: true };
  window.addEventListener("wheel", cancel, opts);
  window.addEventListener("touchstart", cancel, opts);
  window.addEventListener("keydown", cancel, opts);
  cleanupInput = () => {
    window.removeEventListener("wheel", cancel);
    window.removeEventListener("touchstart", cancel);
    window.removeEventListener("keydown", cancel);
  };

  if (duration === 0) {
    window.scrollTo({ top: endY, behavior: "instant" as ScrollBehavior });
    stop();
    onDone?.();
    return;
  }

  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    // Re-read the destination every frame so late layout shifts (images, 3D scene) can't make us miss it
    const liveEnd = resolve();
    window.scrollTo({ top: startY + (liveEnd - startY) * easeInOutCubic(t), behavior: "instant" as ScrollBehavior });
    if (t < 1) rafId = requestAnimationFrame(step);
    else {
      stop();
      onDone?.();
    }
  };
  rafId = requestAnimationFrame(step);
}

export function scrollToSection(id: string, onDone?: () => void) {
  if (id === "home") return smoothScrollTo(0, onDone);
  const el = document.getElementById(id);
  if (!el) return onDone?.();
  smoothScrollTo(() => el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET, onDone);
}
