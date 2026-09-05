import { useEffect } from 'react';

/**
 * Lock the page behind a modal — without the page moving.
 *
 * Setting `overflow: hidden` on the body removes the scrollbar, and on any
 * platform that draws a *classic* scrollbar (Windows, Linux, and macOS with
 * "always show scroll bars") that reclaims 15-17px of width. Every centred
 * layout on the page then slides sideways by half of it at the instant the
 * modal opens, and slides back when it closes. That was the Audi case study's
 * "content jumps when I click to view".
 *
 * Two defences, because one is not enough:
 *
 * 1. `html { scrollbar-gutter: stable }` in index.css reserves the gutter
 *    permanently, so hiding the scrollbar changes nothing. This is the real
 *    fix and it costs nothing.
 * 2. For browsers that do not support it (Safari < 16), measure the gap that
 *    actually opened up and pad the body by exactly that much.
 *
 * Reference-counted, because the Audi page can have a piece modal and the
 * mobile nav open at once, and the second one to close must not unlock early.
 */
let locks = 0;
let prevOverflow = '';
let prevPad = '';

const lock = () => {
  if (locks++ > 0) return;
  const body = document.body;
  prevOverflow = body.style.overflow;
  prevPad = body.style.paddingRight;

  // Measured BEFORE hiding, so it is the width the scrollbar is really using.
  // Zero when the gutter is already reserved, or when the scrollbar is an
  // overlay (macOS default, every touch device) — in which case we add
  // nothing, which is correct.
  const gap = window.innerWidth - document.documentElement.clientWidth;
  body.style.overflow = 'hidden';
  if (gap > 0) body.style.paddingRight = `${gap}px`;
};

const unlock = () => {
  if (locks === 0) return;
  if (--locks > 0) return;
  const body = document.body;
  body.style.overflow = prevOverflow;
  body.style.paddingRight = prevPad;
};

/** Locks while `active` is true, and always releases on unmount. */
export function useScrollLock(active = true) {
  useEffect(() => {
    if (!active) return;
    lock();
    return unlock;
  }, [active]);
}

export default useScrollLock;
