import { useEffect } from 'react';

/**
 * Eased wheel scrolling.
 *
 * The native wheel step is abrupt, which made the pinned sections feel twitchy
 * and hard to land on. This intercepts wheel input and eases the page toward a
 * target offset instead of jumping to it.
 *
 * Deliberate constraints, because smooth-scroll implementations are a classic
 * source of the exact bugs we are trying to avoid:
 *
 * - Wheel only. Keyboard, scrollbar dragging, anchor jumps, find-in-page and
 *   touch are all left completely alone, so nothing can be trapped.
 * - The target re-syncs to the real scroll position whenever the page moves by
 *   any other means, so it can never fight the browser or strand the user.
 * - It disables itself for coarse pointers and for prefers-reduced-motion.
 * - The rAF loop stops the moment it arrives; it never idles.
 * - Bounded per-event delta, so a trackpad fling or a "scroll to bottom"
 *   gesture cannot overshoot into a long uninterruptible glide.
 * - The pending glide can never run more than ~0.55 screens ahead of the
 *   current position. Without that cap, a hard inertial fling accumulates a
 *   target screens ahead and warps straight through pinned sections
 *   (What I Do) in fast-forward — the exact "it never stops me" failure.
 */

const clamp = (v: number, min: number, max: number) => (v < min ? min : v > max ? max : v);

export function useSmoothScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    let target = window.scrollY;
    let raf = 0;
    let animating = false;
    /**
     * The offset we last wrote ourselves. Scroll events are dispatched
     * asynchronously, so a boolean "is this mine" flag is always stale by the
     * time the handler runs — comparing against the expected position is the
     * only reliable way to tell our own scroll from a real user one.
     */
    let selfScrollY = -1;

    const maxScroll = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    /** Frames during which our writes produced no movement. */
    let stalled = 0;

    const stop = () => {
      animating = false;
      stalled = 0;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    };

    const tick = () => {
      const before = window.scrollY;
      const distance = target - before;

      // Arrived (or something external moved us onto the target).
      if (Math.abs(distance) < 0.5) {
        stop();
        return;
      }

      // If the document refuses to move (scroll locked by an open overlay, or
      // we are pinned against a boundary) give up rather than spin forever.
      if (stalled > 6) {
        target = before;
        stop();
        return;
      }

      // Ease toward the target. The factor gives a calm, controllable glide
      // without feeling laggy on long travels.
      // 0.105 (was 0.14): slightly less aggressive so pinned sections get a
      // beat of stillness at their end stops instead of being rushed past.
      const stepSize = distance * 0.105;
      // Guarantee forward progress so we can never stall just short.
      const step = Math.abs(stepSize) < 0.5 ? Math.sign(stepSize) * 0.5 : stepSize;

      const next = before + step;
      selfScrollY = next;
      window.scrollTo(0, next);

      stalled = Math.abs(window.scrollY - before) < 0.05 ? stalled + 1 : 0;

      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (animating) return;
      animating = true;
      stalled = 0;
      raf = requestAnimationFrame(tick);
    };

    const onWheel = (e: WheelEvent) => {
      // Never touch pinch-zoom, or scrolling inside a genuinely scrollable
      // child element (modals, code blocks, overflow panes).
      if (e.ctrlKey || e.defaultPrevented) return;

      let node = e.target as HTMLElement | null;
      while (node && node !== document.body && node !== document.documentElement) {
        const style = getComputedStyle(node);
        const scrollable = /(auto|scroll|overlay)/.test(style.overflowY);
        if (scrollable && node.scrollHeight > node.clientHeight + 1) return;
        node = node.parentElement;
      }

      let delta = e.deltaY;
      // Normalise line / page based wheel units to pixels.
      if (e.deltaMode === 1) delta *= 18;
      else if (e.deltaMode === 2) delta *= window.innerHeight;

      // Cap one gesture's contribution so a fling cannot launch a huge glide.
      delta = clamp(delta, -window.innerHeight * 0.75, window.innerHeight * 0.75);

      const max = maxScroll();
      // If we are not currently animating, base the new target on where the
      // page actually is, not on a stale value.
      const base = animating ? target : window.scrollY;
      let next = base + delta;
      // No matter how much inertia a fling feeds in, the glide may only ever
      // lead the real position by ~0.55 screens. Trackpads keep emitting
      // events while the fingers move, so deliberate fast scrolling keeps its
      // glide; a released fling dies inside half a screen and can never warp
      // through a pinned sequence.
      const lead = window.innerHeight * 0.55;
      next = clamp(next, window.scrollY - lead, window.scrollY + lead);
      next = clamp(next, 0, max);

      // At a boundary there is nothing to do; let the browser behave normally
      // (this also keeps overscroll / pull-to-refresh semantics intact).
      if (next === window.scrollY && !animating) return;

      e.preventDefault();
      target = next;
      start();
    };

    // Any scroll we did not cause (scrollbar drag, anchor, keyboard, or a
    // native smooth scrollIntoView such as the navbar wordmark) immediately
    // becomes the new truth, so the two can never fight over the viewport.
    const onScroll = () => {
      // Within a pixel of what we just wrote => this is our own animation.
      if (animating && Math.abs(window.scrollY - selfScrollY) < 2) return;
      target = window.scrollY;
      stop();
    };

    // A resize changes scrollHeight; re-clamp so we cannot aim past the end.
    const onResize = () => {
      target = clamp(target, 0, maxScroll());
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      stop();
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);
}
