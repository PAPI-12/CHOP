import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const SKILLS = [
  { title: 'UX/UI DESIGN', note: 'interfaces with instinct', color: '#f5f3ee' },
  { title: 'ART DIRECTION', note: 'visual systems with attitude', color: '#d7ff4f' },
  { title: 'CINEMATOGRAPHY', note: 'motion shaped by feeling', color: '#d7c4aa' },
  { title: 'GRAPHIC DESIGN', note: 'culture-led systems & print', color: '#d7ff4f' },
  { title: 'AI CREATIVE', note: 'future-facing image craft', color: '#f5f3ee' },
];

const N = SKILLS.length;
const LAST = N - 1;

/**
 * The card that leads into the machine act. It is NOT a skill — it only exists
 * on Home, rising after the last skill passes, so the INITIALIZING stage is
 * ushered in by the studio motto rather than a service line.
 */
const MOTTO = 'ART COMES 1ST';

/**
 * Glyph pool for the code effect: the machine speaks the site's own
 * vocabulary rather than handset katakana. Brand words are deliberately
 * over-represented so the rain reads as PAPI code, not a movie reference.
 */
const MATRIX_GLYPHS =
  'CRAFTINGAWESOMENESS2015CULTRLDVIXPAPI·0123456789<>*+-=/\\|#$%&@';

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const smoothstep = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

/** Deterministic per-slot glyph so letters don't strobe randomly every frame. */
const glyphFor = (seed: number) => MATRIX_GLYPHS[Math.abs(seed) % MATRIX_GLYPHS.length];

/** Deterministic 0..1 noise for the robot's typing rhythm (stable re-paints). */
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/* ── Timeline ══════════════════════════════════════════════════════════
   HOME — scroll-driven, no pausing:
     0.00 → 0.60  the five skills glide past CONTINUOUSLY (no dwell — the
                  stack always moves with the scroll, at a deliberate pace);
                  the motto ART COMES 1ST rises behind them and parks front
     0.62 → 0.72  the motto encodes into brand glyphs, left to right
     0.72 → 0.80  brownout: the power gutters and the motto dies mid-air
     0.80         TRIGGER — from here the machine acts by itself, on a clock:
                  INITIALIZING decrypts (1.4s), then the robot types its three
                  lines like a person (jittered cadence, breaths between
                  lines). Scrolling is held until the transmission is over,
                  then the surge rains down, "continue" lights, and the pin
                  hands off to Featured Work.
     0.86 → 1.00  the code SPILLS out of the section: a viewport-fixed layer
                  of light drops carries the rain over Featured Work and only
                  rains itself out once the visitor keeps scrolling down.
   ABOUT — never blank:
     0.00 → 0.78  the same continuous glide; AI CREATIVE sails off in its
                  original white like every other skill
     0.74 → 0.92  "continue" + scanline fade in AS the last card still dims,
                  overlapping so the stage never sits empty
     0.9x → 1.00  the pin releases and Experience is pulled up. */
const T_SKILLS_END = 0.6;
const T_CODE_START = 0.62;
const T_CODE_END = 0.72;
const T_VANISH_END = 0.8;
const T_CUE_FADE_START = 0.42;
const T_CUE_FADE_END = 0.56;

/** Where the spill layer starts bleeding past the section edge. */
const T_SPILL_START = 0.86;

/** Total scroll length of the pinned sequences, in screen heights. */
const SCREENS_HOME = 8.2;
const SCREENS_ABOUT = 5.6;

/** Machine dialogue, revealed one line at a time. */
const ROBOT_LINES = [
  'OH, HELLO',
  'YOU CAN NOW CONTINUE TO FEATURED WORK',
  'FOLLOW THE MATRIX CODE',
];

const INIT_WORD = 'INITIALIZING';
const BOOT_TAG = 'PAPI.SYS · BOOT SEQUENCE';

/**
 * One-shot, module-level: the robot transmission is experienced ONCE per
 * visit. After it plays, revisiting the section shows the skills and the code
 * rain (and "continue") — never the machine again. A full reload resets it,
 * and the Navbar re-arms it when the PAPI RABORIFE brand mark is clicked.
 */
let machineActSpent = false;
export const resetMachineAct = () => { machineActSpent = false; };

/* Robot schedule (seconds). The decrypt, the typing, the pauses. */
const T_BOOT = 1.35;
const LINE_GAP = 0.75; // the robot takes a breath between lines

/** Cumulative per-character timestamps for one line — human typing rhythm. */
const buildLineSchedule = (line: string, startAt: number) => {
  const times: number[] = [];
  let t = startAt;
  for (let i = 0; i < line.length; i++) {
    times.push(t);
    const prev = line[i - 1];
    let d = 0.034 + rand(i * 17 + startAt * 100) * 0.032;
    if (prev === ' ') d += 0.05;
    if (prev && ',.—'.includes(prev)) d += 0.16;
    t += d;
  }
  return { times, end: t + 0.12 };
};

const WhatIDo: React.FC<{ variant?: 'home' | 'about' }> = ({ variant = 'home' }) => {
  /**
   * home  — skills glide → ART COMES 1ST encodes → machine wakes (auto-played,
   *         scroll-held) → surge hands off to Featured Work, and the code
   *         spills over the boundary into it.
   * about — the practice only: the same glide, AI CREATIVE exits in white,
   *         then "continue" lights and Experience is pulled up. No machine.
   */
  const machineMode = variant !== 'about';
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rainRef = useRef<HTMLCanvasElement>(null);
  const spillRef = useRef<HTMLCanvasElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const titleRefs = useRef<Array<HTMLHeadingElement | null>>([]);
  const noteRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const dotRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const counterRef = useRef<HTMLSpanElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLParagraphElement>(null);
  const termRef = useRef<HTMLDivElement>(null);
  const initRef = useRef<HTMLParagraphElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const bootTagRef = useRef<HTMLParagraphElement>(null);
  const lineRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const guideRef = useRef<HTMLDivElement>(null);

  /**
   * The spill layer is a portal so it can sit ABOVE the following section:
   * anything rendered inside this component is trapped in the page's own
   * stacking order and would be painted over by Featured Work's opaque
   * background. Decided once, at mount, so the ref exists for the layout
   * effect on the very first commit.
   */
  const [spillOn] = useState(
    () =>
      typeof window !== 'undefined' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  // Variant-resolved choreography values, captured by the effects below.
  const SCREENS = machineMode ? SCREENS_HOME : SCREENS_ABOUT;

  // Layout effect, not a passive one: the spacer / stage heights are written
  // before paint so the pin never gets a frame at its fallback size.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    const cards = cardRefs.current;
    const titles = titleRefs.current;
    const notes = noteRefs.current;
    const dots = dotRefs.current;
    const originals = SKILLS.map((s) => Array.from(s.title));
    if (machineMode) originals[N] = Array.from(MOTTO);

    /** 0 = no rain, 1 = full rain. Read by the canvas loop. */
    let rainAlpha = 0;
    /** 0 = normal fall, 1 = Reloaded surge on the way out. */
    let rainBoost = 0;
    /** 0 = no spill, 1 = full spill over the following section. */
    let spillAlpha = 0;

    /**
     * The pin's height is measured and written in pixels. Pure-CSS svh
     * heights are the classic failure here: any environment that mishandles
     * the unit collapses the spacer to its fallback, travel hits zero, and
     * the section scrolls straight past having shown only the first skill.
     * Pixels cannot be misread.
     */
    const measure = () => {
      const vh = window.innerHeight;
      root.style.height = `${Math.round(vh * SCREENS)}px`;
      stage.style.height = `${Math.max(vh, 480)}px`;
    };

    /* ── The machine act: triggered by scroll, played by a clock ─────── */

    // Robot line schedules: human typing rhythm with breaths between lines.
    const lineSchedules = (() => {
      let t = T_BOOT + 0.35;
      return ROBOT_LINES.map((line) => {
        const s = buildLineSchedule(line, t);
        t = s.end + LINE_GAP;
        return s;
      });
    })();
    const SPEAK_END = lineSchedules[lineSchedules.length - 1].end;
    // Hold ends shortly after the last character: the surge itself is then
    // scroll-driven, so the visitor is never held for the whole outro.
    const ACT_DONE = SPEAK_END + 1.4;

    let actStart = -1; // ms timestamp; -1 = idle
    let lockY = 0;
    let snapping = false;
    let lockArmed = false;
    // Persistent-scroll breakout: the hold is a courtesy pause for the robot
    // while it talks — if the visitor keeps insisting (accumulated wheel
    // intent past a threshold), the hold yields and lets them through.
    let breakoutDelta = 0;
    const BREAKOUT = 700;

    const canHold = () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const holdScroll = (e?: Event) => {
      if (e && 'deltaY' in (e as WheelEvent)) {
        breakoutDelta += Math.abs((e as WheelEvent).deltaY);
        if (breakoutDelta > BREAKOUT) {
          // They clearly want out: release the hold, and don't replay the
          // transmission to someone who walked through it.
          machineActSpent = true;
          disarmLock();
          return;
        }
      }
      if (e && e.cancelable) e.preventDefault();
      if (snapping) return;
      if (Math.abs(window.scrollY - lockY) > 1) {
        snapping = true;
        window.scrollTo({ top: lockY, behavior: 'instant' as ScrollBehavior });
        requestAnimationFrame(() => { snapping = false; });
      }
    };

    /** Keyboard is never trapped: any paging key ends the hold immediately. */
    const holdKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (
        ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Escape', 'Tab'].includes(
          e.key,
        )
      ) {
        machineActSpent = true;
        disarmLock();
      }
    };

    const armLock = () => {
      if (lockArmed || !canHold()) return;
      lockArmed = true;
      lockY = window.scrollY;
      breakoutDelta = 0;
      window.addEventListener('scroll', holdScroll, { passive: true });
      window.addEventListener('wheel', holdScroll, { passive: false });
      window.addEventListener('touchmove', holdScroll, { passive: false });
      window.addEventListener('keydown', holdKey);
    };

    function disarmLock() {
      if (!lockArmed) return;
      lockArmed = false;
      window.removeEventListener('scroll', holdScroll);
      window.removeEventListener('wheel', holdScroll);
      window.removeEventListener('touchmove', holdScroll);
      window.removeEventListener('keydown', holdKey);
    }

    /** Full reset — called when the section leaves the viewport either way. */
    const resetAct = () => {
      actStart = -1;
      disarmLock();
      if (initRef.current) { initRef.current.dataset.txt = ''; initRef.current.style.opacity = '0'; }
      lineRefs.current.forEach((el) => { if (el) { el.dataset.txt = ''; el.style.visibility = 'hidden'; } });
    };

    /* ── Stack painting ─────────────────────────────────────────────── */

    const paint = (p: number, nowMs: number) => {
      // Continuous front: the stack NEVER pauses. Home glides through the 5
      // skills and raises the motto (index N) which parks at the front;
      // About glides through the skills and lets AI CREATIVE sail off.
      // About runs a hair past the last card so AI CREATIVE finishes its exit
      // instead of freezing half-faded for the rest of the pin.
      const glideEnd = machineMode ? T_SKILLS_END : 0.86;
      const glideSpan = machineMode ? N + 0.15 : N + 0.6;
      const front = clamp01(p / glideEnd) * glideSpan;

      const codeT =
        machineMode && p > T_CODE_START ? smoothstep((p - T_CODE_START) / (T_CODE_END - T_CODE_START)) : 0;
      const vanishT =
        machineMode && p > T_CODE_END ? smoothstep((p - T_CODE_END) / (T_VANISH_END - T_CODE_END)) : 0;
      // Raw (un-eased) vanish for the power-down, so the die-out reads as a
      // failing supply rather than a smooth fade.
      const vanishRaw = machineMode ? clamp01((p - T_CODE_END) / (T_VANISH_END - T_CODE_END)) : 0;

      /* ── Auto act clock ─────────────────────────────────────────── */
      // Fire only while the pin genuinely holds the stage (past-travel p≈1
      // means the stage is already leaving — never re-arm there), and only
      // once per visit: the transmission is never replayed on re-entry.
      if (machineMode && actStart < 0 && !machineActSpent && p >= T_VANISH_END && p <= 0.995) {
        actStart = nowMs;
        armLock();
      }
      // Scrolled back above the trigger (or past the end) while the machine
      // was mid-act: reset to the skills state so the section never shows a
      // spent matrix when revisited.
      if (machineMode && actStart > 0 && (p < T_VANISH_END - 0.05 || p > 0.995)) {
        resetAct();
      }
      const actT = machineMode && actStart > 0 ? (nowMs - actStart) / 1000 : 0;
      const acting = machineMode && actStart > 0 && actT <= ACT_DONE + 0.5;

      const initT = actT > 0 ? clamp01(actT / T_BOOT) : 0;
      const speakT = actT > T_BOOT + 0.35 ? 1 : 0; // arm flag; lines use their schedules
      const releaseT = actT > SPEAK_END ? smoothstep((actT - SPEAK_END) / 0.9) : 0;
      const surgeT = actT > SPEAK_END - 0.5 ? smoothstep((actT - (SPEAK_END - 0.5)) / 2.0) : 0;
      if (machineMode && actStart > 0 && actT > ACT_DONE) {
        // Transmission complete: release any hold and remember — the machine
        // plays once per visit, then the section belongs to scroll again.
        // (Touch devices are never held, so this is also where THEY mark the
        // act as spent; otherwise it replayed on every pass.)
        machineActSpent = true;
        disarmLock();
      }
      // After the transmission (or after a breakout), the deep end of the pin
      // still carries the code rain and the continue guide — scroll-driven now.
      const spentZone =
        machineMode && machineActSpent && actStart < 0 && p >= T_VANISH_END
          ? smoothstep((p - T_VANISH_END) / 0.08)
          : 0;

      // About exit: furniture fades as "continue" takes over the stage.
      const outT = machineMode ? 0 : smoothstep((p - 0.84) / 0.14);

      rainAlpha = Math.max(
        codeT * 0.85,
        vanishT,
        initT * 0.9,
        machineMode ? Math.max(surgeT, (actT > 0 && acting) ? 0.35 : 0, spentZone * 0.45) : 0,
      );
      rainBoost = surgeT;

      const idx = Math.min(LAST, Math.round(Math.min(front, LAST)));
      if (counterRef.current && counterRef.current.dataset.n !== String(idx)) {
        counterRef.current.dataset.n = String(idx);
        counterRef.current.textContent = `0${idx + 1}`;
      }

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const title = titles[i];
        if (!card) continue;

        // Depth: > 0 means still stacked behind, 0 = front, < 0 = passed.
        let depth = i - front;
        const isMotto = machineMode && i === N;
        // The motto parks at the front to be encoded; it never flies past.
        if (isMotto) depth = Math.max(depth, 0);

        let scale: number;
        let opacity: number;

        if (depth >= 0) {
          // Behind the front: medium size, low opacity, rising toward the user.
          scale = 1 / (1 + depth * 0.42);
          opacity = Math.max(0, 1 - depth * 0.52);
        } else {
          // Already passed: drifts toward the viewer and peels off — slow
          // enough that the hand-off reads as deliberate, never rushed.
          const d = -depth,
            gentle = smoothstep(Math.min(d, 1.4) / 1.4);
          scale = 1 + gentle * 0.85;
          opacity = Math.max(0, 1 - gentle * 1.05);
        }

        if (isMotto) {
          // Power-down: the supply gutters a few times before it dies, and the
          // glyphs swell as the last of the charge dumps out.
          if (vanishRaw > 0) {
            const gutter = Math.sin(vanishRaw * 34) * 0.5 + 0.5;
            const brownout = (1 - vanishRaw) * (0.55 + gutter * 0.45);
            opacity *= Math.max(0, brownout);
            scale *= 1 + vanishRaw * 0.42;
          }
        }

        // Home: passed cards dissolve fully as the machine act approaches, so
        // by INITIALIZING the stage holds ART COMES 1ST alone.
        if (machineMode && depth < 0) {
          opacity *= 1 - smoothstep((p - T_SKILLS_END) / 0.16);
        }

        // Cards far off the stack are removed from the compositor entirely.
        const shown = opacity > 0.004 && depth < 3.4;
        card.style.visibility = shown ? 'visible' : 'hidden';
        if (!shown) continue;

        card.style.opacity = opacity.toFixed(3);
        card.style.transform = `translate3d(-50%, -50%, 0) scale(${scale.toFixed(4)})`;
        // Nearer cards paint on top.
        card.style.zIndex = String(100 - Math.round(depth * 10));

        if (title && isMotto) {
          // Encode the motto, left to right, during the code phase.
          if (codeT > 0.001) {
            const letters = title.children;
            const total = letters.length;
            for (let li = 0; li < total; li++) {
              const el = letters[li] as HTMLElement;
              const orig = originals[i][li];
              if (orig === ' ') continue;
              // Letters convert left-to-right as codeT advances.
              const threshold = li / total;
              if (codeT > threshold) {
                // Slow, readable churn rather than per-frame noise.
                const tick = Math.floor(codeT * 26) + li * 7;
                el.textContent = glyphFor(tick);
                el.style.color = '#d7ff4f';
              } else {
                el.textContent = orig;
                el.style.color = '';
              }
            }
            title.style.textShadow = `0 0 ${(12 * codeT).toFixed(1)}px rgba(215,255,79,${(0.5 * codeT).toFixed(2)})`;
          } else {
            const letters = title.children;
            for (let li = 0; li < letters.length; li++) {
              const el = letters[li] as HTMLElement;
              el.textContent = originals[i][li];
              el.style.color = '';
            }
            title.style.textShadow = 'none';
          }
        }
      }

      // Bottom copy follows the front card, with real breathing room.
      for (let i = 0; i < N; i++) {
        const note = notes[i];
        if (!note) continue;
        const dist = Math.abs(front - i);
        // Gentle falloff: captions linger through the hand-off instead of
        // snapping in and out, which is what made swaps feel rushed.
        const vis =
          machineMode && i === LAST
            ? smoothstep(1 - Math.min(dist, 1)) * (1 - smoothstep((p - T_SKILLS_END + 0.06) / 0.1)) * (1 - codeT)
            : smoothstep(1 - Math.min(dist, 1)) * (1 - codeT);
        const shown = vis > 0.004;
        note.style.visibility = shown ? 'visible' : 'hidden';
        if (!shown) continue;
        note.style.opacity = vis.toFixed(3);
        note.style.transform = `translate3d(-50%, ${((1 - vis) * 10).toFixed(1)}px, 0)`;
      }

      for (let i = 0; i < N; i++) {
        const dot = dots[i];
        if (!dot) continue;
        const on = i === idx;
        dot.style.transform = `scaleY(${on ? 1 : 0.25})`;
        dot.style.backgroundColor = on ? '#d7ff4f' : 'rgba(245,243,238,0.25)';
        dot.style.opacity = String(1 - (machineMode ? vanishT : outT));
      }

      if (headerRef.current) {
        headerRef.current.style.opacity = (
          1 - smoothstep((machineMode ? vanishT : outT) * 1.2)
        ).toFixed(3);
      }

      // The cue retires as the glide nears the motto — it sits ABOVE the stack
      // now, balancing the caption below, and it melts away once the practice
      // has been walked through.
      if (cueRef.current) {
        const o = 1 - smoothstep(
          (p - T_CUE_FADE_START) / (T_CUE_FADE_END - T_CUE_FADE_START),
        );
        cueRef.current.style.opacity = o.toFixed(3);
        cueRef.current.style.visibility = o > 0.01 ? 'visible' : 'hidden';
      }

      /* ── Terminal boot, then the machine speaks (clock-driven) ────── */

      const term = termRef.current;
      if (term) {
        const live = actT > 0 && acting;
        term.style.visibility = live ? 'visible' : 'hidden';
        term.style.opacity = actT > 0 ? (1 - releaseT).toFixed(3) : '0';
      }

      if (bootTagRef.current) {
        bootTagRef.current.style.opacity =
          actT > 0 ? (speakT > 0 ? '0.4' : '0.8') : '0';
      }

      if (initRef.current) {
        if (actT > 0 && speakT <= 0) {
          // The word decrypts out of nowhere, left to right, letters settling
          // out of glyph noise; then the dots accrue while the bar fills.
          const decodeT = clamp01(initT / 0.55);
          let text = '';
          const tick = Math.floor(actT * 18);
          for (let li = 0; li < INIT_WORD.length; li++) {
            if (decodeT >= (li + 1) / INIT_WORD.length) text += INIT_WORD[li];
            else if (decodeT > li / INIT_WORD.length - 0.28) text += glyphFor(tick * 13 + li * 31);
          }
          if (decodeT >= 1) {
            const dotsCount = Math.min(5, Math.floor(clamp01((initT - 0.55) / 0.45) * 6));
            text += '.'.repeat(dotsCount);
          }
          if (initRef.current.dataset.txt !== text) {
            initRef.current.dataset.txt = text;
            initRef.current.textContent = text;
          }
          initRef.current.style.opacity = '1';
        } else if (actT > 0) {
          if (initRef.current.dataset.txt !== 'BOOT_OK') {
            initRef.current.dataset.txt = 'BOOT_OK';
            initRef.current.textContent = `${INIT_WORD}..... OK`;
          }
          initRef.current.style.opacity = '0.45';
        } else {
          initRef.current.style.opacity = '0';
          initRef.current.dataset.txt = '';
        }
      }

      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${(speakT > 0 ? 1 : initT).toFixed(3)})`;
        barRef.current.style.opacity = actT > 0 ? (speakT > 0 ? '0.35' : '1') : '0';
      }

      // Three lines, typed by their own human-rhythm schedules. The caret sits
      // on the line being written; between lines the robot pauses, thinking.
      for (let i = 0; i < ROBOT_LINES.length; i++) {
        const el = lineRefs.current[i];
        if (!el) continue;
        const sched = lineSchedules[i];
        const times = sched.times;
        let count = 0;
        if (actT > 0) {
          const rel = actT;
          count = rel >= times[0] ? 1 : 0;
          for (let k = 1; k < times.length; k++) {
            if (rel >= times[k]) count = k + 1;
            else break;
          }
        }
        if (count <= 0) {
          el.style.visibility = 'hidden';
          el.dataset.txt = '';
          continue;
        }
        el.style.visibility = 'visible';
        const full = count >= ROBOT_LINES[i].length && actT > sched.end;
        const txt = full ? ROBOT_LINES[i] : ROBOT_LINES[i].slice(0, count);
        if (el.dataset.txt !== txt) {
          el.dataset.txt = txt;
          el.textContent = txt;
        }
        // Caret rides the line currently being written, then moves on.
        el.dataset.caret = !full && releaseT < 1 ? 'true' : 'false';
      }

      // The way out: a scanline at the foot of the stage, pointing down.
      // Home: rides the robot's surge. About: fades in while the last card is
      // still dimming, so the stage never goes blank, then pulls Experience up.
      if (guideRef.current) {
        const g = machineMode
          ? Math.max(surgeT, spentZone)
          : smoothstep((p - 0.74) / 0.18) * (1 - outT * 0.2);
        guideRef.current.style.opacity = g.toFixed(3);
        guideRef.current.style.visibility = g > 0.01 ? 'visible' : 'hidden';
      }
    };

    /* ── Matrix rain ────────────────────────────────────────────────── */

    const canvas = rainRef.current;
    const rctx = canvas?.getContext('2d') ?? null;
    type Col = { x: number; y: number; speed: number; len: number; seed: number };
    let columns: Col[] = [];
    let cw = 0;
    let ch = 0;
    let dpr = 1;
    const FONT_SIZE = 15;
    const ROW = 18;

    const setupRain = () => {
      if (!canvas || !rctx) return;
      cw = stage.clientWidth;
      ch = stage.clientHeight;
      if (cw < 8 || ch < 8) return;
      // Retina rain quadruples the pixel cost for no visible gain — cap it.
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(cw * dpr);
      canvas.height = Math.floor(ch * dpr);
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;
      rctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Clean, sparser columns matching the site's calm grid discipline.
      const spacing = 34;
      const count = Math.ceil(cw / spacing);
      columns = [];
      for (let i = 0; i < count; i++) {
        columns.push({
          x: i * spacing + 8,
          y: Math.random() * ch,
          speed: 46 + Math.random() * 104,
          len: 6 + Math.floor(Math.random() * 9),
          seed: Math.floor(Math.random() * 1000),
        });
      }
    };

    /* ── Spill rain: the code that runs OUT of the section ───────────
       A viewport-fixed layer, portalled to <body> so it paints over the
       following section instead of being buried under its background. It
       lights up as the pin ends, keeps raining lightly across the top of
       Featured Work, and rains itself out as the visitor keeps going down.
       Deliberately sparse + slow: ambience, never a curtain over the work. */

    const spill = spillRef.current;
    const sctx = spill?.getContext('2d') ?? null;
    let spillCols: Col[] = [];
    let sw = 0;
    let sh = 0;
    let sdpr = 1;
    const SPILL_FONT = 13;
    const SPILL_ROW = 17;

    const setupSpill = () => {
      if (!spill || !sctx) return;
      sw = window.innerWidth;
      sh = window.innerHeight;
      if (sw < 8 || sh < 8) return;
      sdpr = Math.min(window.devicePixelRatio || 1, 1.5);
      spill.width = Math.floor(sw * sdpr);
      spill.height = Math.floor(sh * sdpr);
      spill.style.width = `${sw}px`;
      spill.style.height = `${sh}px`;
      sctx.setTransform(sdpr, 0, 0, sdpr, 0, 0);

      // Far sparser than the section rain: these are drops, not a downpour.
      const spacing = 76;
      const count = Math.ceil(sw / spacing);
      spillCols = [];
      for (let i = 0; i < count; i++) {
        spillCols.push({
          x: Math.round(i * spacing + 10 + Math.random() * 26),
          y: Math.random() * sh - sh * 0.5,
          speed: 55 + Math.random() * 95,
          len: 4 + Math.floor(Math.random() * 6),
          seed: Math.floor(Math.random() * 1000),
        });
      }
    };

    /* ── Frame loop ─────────────────────────────────────────────────── */

    let raf = 0;
    let running = true;
    let onScreen = false;
    let lastT = 0;
    let lastProgress = -1;
    let rainDrawn = false;
    let spillDrawn = false;
    let rainTick = 0;

    const frame = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      if (!onScreen || document.hidden) { lastT = 0; return; }

      const dt = lastT ? Math.min((now - lastT) / 1000, 0.05) : 1 / 60;
      lastT = now;

      // One rect read per frame, shared by the progress, the stage-visibility
      // test and the spill fade — layout is only ever measured once.
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight;
      const travel = rect.height - vh;
      const p = travel > 0 ? clamp01(-rect.top / travel) : 0;
      const stageVisible = rect.bottom > -1 && rect.top < vh + 1;

      // Repaint on scroll movement, and repaint continuously ONLY while the
      // machine act is actually playing — it runs on its own clock, not on the
      // scroll. Once it has finished, a parked visitor costs nothing again.
      const actLive =
        machineMode && actStart > 0 && (now - actStart) / 1000 <= ACT_DONE + 0.8;
      if (Math.abs(p - lastProgress) > 0.0002 || actLive) {
        lastProgress = p;
        paint(p, now);
      }

      // Spill: fades in with the hand-off, then rains out over ~1 screen of
      // travel past the section. Scroll back up and it is gone with the pin.
      if (machineMode && sctx) {
        const past = vh - rect.bottom; // px travelled beyond the pin's end
        const fadeIn = smoothstep((p - T_SPILL_START) / (1 - T_SPILL_START));
        const fadeOut = 1 - smoothstep((past - vh * 0.1) / vh);
        spillAlpha = fadeIn * clamp01(fadeOut);
      } else {
        spillAlpha = 0;
      }

      // Rain — rendered on a half-cadence tick. Falling code is perceived as
      // continuous at ~30fps, and half the fillText work per second keeps the
      // pinned sequence smooth on modest hardware.
      rainTick ^= 1;

      if (rctx) {
        if (rainAlpha > 0.01 && stageVisible) {
          rainDrawn = true;
          if (rainTick) {
            const speedMul = 1 + rainBoost * 1.35;
            const alpha = Math.min(1, rainAlpha * (1 + rainBoost * 0.2));
            rctx.clearRect(0, 0, cw, ch);
            rctx.font = `${FONT_SIZE}px "JetBrains Mono", ui-monospace, monospace`;
            rctx.textBaseline = 'top';

            for (let i = 0; i < columns.length; i++) {
              const col = columns[i];
              col.y += col.speed * speedMul * dt * 2;
              if (col.y - col.len * ROW > ch) {
                col.y = -Math.random() * ch * 0.5;
                col.speed = 46 + Math.random() * 104;
                col.len = 6 + Math.floor(Math.random() * 9);
              }
              for (let k = 0; k < col.len; k++) {
                const y = col.y - k * ROW;
                if (y < -ROW || y > ch) continue;
                const fade = 1 - k / col.len;
                // Brand lime, not handset green — bodies stay quiet, heads glow.
                rctx.globalAlpha = alpha * fade * (k === 0 ? 0.9 : 0.55);
                rctx.fillStyle = k === 0 ? '#f2ffd0' : '#d7ff4f';
                rctx.fillText(glyphFor(col.seed + k + Math.floor(col.y / ROW)), col.x, y);
              }
            }
            rctx.globalAlpha = 1;
          }
        } else if (rainDrawn) {
          rctx.clearRect(0, 0, cw, ch);
          rainDrawn = false;
        }
      }

      if (sctx && spill) {
        if (spillAlpha > 0.01) {
          spillDrawn = true;
          if (rainTick) {
            sctx.clearRect(0, 0, sw, sh);
            sctx.font = `${SPILL_FONT}px "JetBrains Mono", ui-monospace, monospace`;
            sctx.textBaseline = 'top';
            for (let i = 0; i < spillCols.length; i++) {
              const col = spillCols[i];
              col.y += col.speed * dt * 2;
              if (col.y - col.len * SPILL_ROW > sh) {
                col.y = -Math.random() * sh * 0.6;
                col.speed = 55 + Math.random() * 95;
                col.len = 4 + Math.floor(Math.random() * 6);
              }
              for (let k = 0; k < col.len; k++) {
                const y = col.y - k * SPILL_ROW;
                if (y < -SPILL_ROW || y > sh) continue;
                const fade = 1 - k / col.len;
                sctx.globalAlpha = spillAlpha * fade * (k === 0 ? 0.75 : 0.34);
                sctx.fillStyle = k === 0 ? '#f2ffd0' : '#d7ff4f';
                sctx.fillText(
                  glyphFor(col.seed + k + Math.floor(col.y / SPILL_ROW)),
                  col.x,
                  y,
                );
              }
            }
            sctx.globalAlpha = 1;
          }
        } else if (spillDrawn) {
          sctx.clearRect(0, 0, sw, sh);
          spillDrawn = false;
        }
      }
    };

    /* ── Wiring ─────────────────────────────────────────────────────── */

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    measure();
    setupRain();
    setupSpill();
    paint(0, 0);

    if (reduce) {
      // No pinned choreography and no tall spacer: present the skills as a
      // simple readable list instead.
      root.style.height = 'auto';
      stage.style.position = 'static';
      stage.style.height = 'auto';
      stage.style.overflow = 'visible';
      stage.style.paddingTop = '6rem';
      stage.style.paddingBottom = '4rem';

      // Both the stack wrapper and its inner host are absolutely positioned
      // for the pinned layout; return them to normal flow.
      const listOuter = cards[0]?.parentElement?.parentElement;
      if (listOuter) {
        listOuter.style.position = 'static';
        listOuter.style.padding = '0';
      }
      const listHost = cards[0]?.parentElement;
      if (listHost) {
        listHost.style.height = 'auto';
        listHost.style.display = 'flex';
        listHost.style.flexDirection = 'column';
        listHost.style.alignItems = 'center';
        listHost.style.justifyContent = 'center';
        listHost.style.gap = '0.35rem';
      }
      cards.forEach((c) => {
        if (!c) return;
        c.style.position = 'relative';
        c.style.left = 'auto';
        c.style.top = 'auto';
        c.style.visibility = 'visible';
        c.style.opacity = '1';
        c.style.transform = 'none';
      });
      notes.forEach((nEl) => { if (nEl) nEl.style.visibility = 'hidden'; });
      if (cueRef.current) cueRef.current.style.visibility = 'hidden';
      if (guideRef.current) guideRef.current.style.visibility = 'hidden';
      // Terminal moves into normal flow beneath the list; leaving it
      // absolutely centred would stack it straight on top of the skills.
      if (termRef.current) {
        const t = termRef.current;
        t.style.position = 'static';
        t.style.visibility = 'visible';
        t.style.opacity = '1';
        t.style.paddingTop = '2.5rem';
      }
      if (initRef.current) initRef.current.textContent = `${INIT_WORD}..... OK`;
      ROBOT_LINES.forEach((line, i) => {
        const el = lineRefs.current[i];
        if (!el) return;
        el.style.visibility = 'visible';
        el.textContent = line;
      });
      return;
    }

    /**
     * The top margin is deliberately huge: the loop must stay alive for about
     * a screen and a half AFTER the section has left, because that is exactly
     * where the spill rain is still falling over Featured Work.
     */
    const io = new IntersectionObserver(
      ([entry]) => {
        const wasOn = onScreen;
        onScreen = !!entry?.isIntersecting;
        if (onScreen) { lastT = 0; measure(); setupRain(); lastProgress = -1; }
        // Leaving the section (up or down) resets the machine to the start:
        // come back and you see skills, not a spent terminal.
        if (wasOn && !onScreen) {
          resetAct();
          if (sctx) { sctx.clearRect(0, 0, sw, sh); spillDrawn = false; }
        }
      },
      { rootMargin: '160% 0px 15% 0px' },
    );
    io.observe(root);

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        measure();
        setupRain();
        setupSpill();
        lastProgress = -1;
      }, 150);
    };
    window.addEventListener('resize', onResize, { passive: true });

    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      disarmLock();
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      io.disconnect();
    };
  }, [machineMode, SCREENS]);

  return (
    // Tall spacer drives the pin; the stage inside is what stays on screen.
    // Heights are written in pixels by the layout effect — a pure-CSS unit
    // collapsing is how this section used to lose its lock and flash past.
    <div
      ref={rootRef}
      className="relative z-10 bg-[#171715]"
      style={{ height: machineMode ? '820vh' : '560vh' }}
    >
      {/* The code that runs out of the section. Portalled to <body> so it can
          keep falling ACROSS the next section instead of being clipped by the
          page's stacking order. Below the navbar (z-50), above the content. */}
      {machineMode && spillOn && typeof document !== 'undefined'
        ? createPortal(
            <canvas
              ref={spillRef}
              aria-hidden
              className="pointer-events-none fixed inset-0 z-[30]"
              style={{
                // Heaviest at the top of the new section, thinning downward —
                // it reads as rain arriving, not as a screen-wide filter.
                maskImage:
                  'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0) 100%)',
                WebkitMaskImage:
                  'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0) 100%)',
              }}
            />,
            document.body,
          )
        : null}

      <div
        ref={stageRef}
        className="sticky top-0 overflow-hidden bg-[#171715]"
        style={{ height: '100vh', minHeight: '480px', boxShadow: '0 -40px 80px rgba(0,0,0,0.45)', borderTop: '1px solid rgba(245,243,238,0.08)' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(90% 60% at 50% 42%, rgba(215,255,79,0.045), transparent 62%)' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d7ff4f]/35 to-transparent"
        />

        {/* Matrix rain sits behind the type but above the ambient wash.
            Home only — the About variant never wakes the machine. */}
        {machineMode && (
          <canvas ref={rainRef} className="pointer-events-none absolute inset-0 z-[2]" aria-hidden />
        )}

        <div
          ref={headerRef}
          className="absolute top-20 md:top-28 left-4 sm:left-6 lg:left-12 xl:left-24 right-4 sm:right-6 lg:right-12 xl:right-24 flex items-center justify-between gap-4 z-20"
        >
          <p className="text-[10px] md:text-xs font-bold tracking-[0.35em] uppercase text-[#8f8f88]">What I Do</p>
          <p className="font-mono text-[10px] md:text-xs tracking-[0.25em] text-[#8f8f88]">
            <span ref={counterRef} className="text-[#d7ff4f]">01</span> — 0{N}
          </p>
        </div>

        {/* Skill stack. Every card occupies the same centre point; depth is
            expressed purely through scale + opacity, so nothing reflows.
            The motto card (Home only) rises after the skills and parks. */}
        <div className="absolute inset-0 z-10 flex items-center justify-center px-4 sm:px-6 lg:px-12">
          <div className="relative w-full h-full">
            {SKILLS.map((skill, i) => (
              <div
                key={skill.title}
                ref={(el) => { cardRefs.current[i] = el; }}
                className="absolute left-1/2 top-1/2 w-full select-none will-change-transform"
                style={{ transform: 'translate3d(-50%, -50%, 0)', visibility: 'hidden' }}
              >
                <h3
                  ref={(el) => { titleRefs.current[i] = el; }}
                  className="font-display text-center text-[9.6vw] sm:text-[9.2vw] md:text-[9vw] lg:text-[8.5vw] leading-[0.95] tracking-[-0.04em] whitespace-nowrap"
                  style={{ color: skill.color }}
                >
                  {Array.from(skill.title).map((ch, li) => (
                    <span key={li}>{ch === ' ' ? '\u00A0' : ch}</span>
                  ))}
                </h3>
              </div>
            ))}
            {machineMode && (
              <div
                ref={(el) => { cardRefs.current[N] = el; }}
                className="absolute left-1/2 top-1/2 w-full select-none will-change-transform"
                style={{ transform: 'translate3d(-50%, -50%, 0)', visibility: 'hidden' }}
              >
                <h3
                  ref={(el) => { titleRefs.current[N] = el; }}
                  className="font-display text-center text-[9.6vw] sm:text-[9.2vw] md:text-[9vw] lg:text-[8.5vw] leading-[0.95] tracking-[-0.04em] whitespace-nowrap"
                  style={{ color: '#f5f3ee' }}
                >
                  {Array.from(MOTTO).map((ch, li) => (
                    <span key={li}>{ch === ' ' ? '\u00A0' : ch}</span>
                  ))}
                </h3>
              </div>
            )}
          </div>
        </div>

        {/* Skill copy, parked well beneath the stack — real breathing room in
            the dark field, so title, caption and cue read as a spread. */}
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 z-20 mt-[9.6vw] md:mt-[8.8vw] lg:mt-[8vw] h-10">
          {SKILLS.map((skill, i) => (
            <p
              key={skill.note}
              ref={(el) => { noteRefs.current[i] = el; }}
              className="hand-note absolute left-1/2 top-0 whitespace-nowrap text-[#d7c4aa] text-[15px] sm:text-lg md:text-[1.7rem] lg:text-[1.9rem] leading-none"
              style={{ transform: 'translate3d(-50%, 0, 0)', visibility: 'hidden' }}
            >
              {skill.note}
            </p>
          ))}
        </div>

        <div className="absolute right-2 sm:right-4 lg:right-8 top-1/2 -translate-y-1/2 flex-col gap-2 items-center z-20 hidden md:flex" aria-hidden>
          {SKILLS.map((s, i) => (
            <span
              key={s.title}
              ref={(el) => { dotRefs.current[i] = el; }}
              className="block w-[3px] h-6 rounded-full origin-center"
              style={{
                backgroundColor: i === 0 ? '#d7ff4f' : 'rgba(245,243,238,0.25)',
                transform: i === 0 ? 'scaleY(1)' : 'scaleY(0.25)',
              }}
            />
          ))}
        </div>

        {/* Scroll hint now sits ABOVE the stack, balancing the captions below
            and using the dark headroom instead of crowding the type. */}
        <p
          ref={cueRef}
          className="hand-note absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[12.4vw] md:-translate-y-[11vw] lg:-translate-y-[10vw] text-[#d7c4aa] text-xs sm:text-sm md:text-xl rotate-[-2deg] whitespace-nowrap z-20"
        >
          scroll to move through the practice
        </p>

        {/* Machine terminal. Occupies the exact centre the stack vacated.
            Home only — the About run ends with "continue". */}
        {machineMode && (
        <div
          ref={termRef}
          className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 md:gap-6 px-6"
          style={{ visibility: 'hidden', opacity: 0 }}
          aria-live="polite"
        >
          {/* CRT scanlines, only ever visible with the terminal. */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'repeating-linear-gradient(0deg, rgba(215,255,79,0.045) 0 1px, transparent 1px 4px)',
            }}
          />
          <div className="flex w-full max-w-[min(34rem,82vw)] flex-col items-center gap-2">
            <p
              ref={bootTagRef}
              className="font-mono text-[9px] md:text-[10px] tracking-[0.5em] uppercase text-[#8f8f88]"
              style={{ opacity: 0 }}
            >
              {BOOT_TAG}
            </p>
            <p
              ref={initRef}
              className="font-mono text-center text-[#d7ff4f] text-[2.6vw] sm:text-[1.5vw] md:text-[0.95vw] lg:text-[0.8vw] tracking-[0.34em] whitespace-nowrap"
              style={{ opacity: 0, minHeight: '1.2em' }}
            />
            {/* Boot progress. */}
            <span className="block h-px w-full overflow-hidden bg-[#d7ff4f]/15" aria-hidden>
              <span
                ref={barRef}
                className="block h-full w-full origin-left bg-[#d7ff4f]"
                style={{ transform: 'scaleX(0)', opacity: 0 }}
              />
            </span>
          </div>

          <div className="flex flex-col items-center gap-3 md:gap-4">
            {ROBOT_LINES.map((line, i) => (
              <p
                key={line}
                ref={(el) => { lineRefs.current[i] = el; }}
                data-caret="false"
                className={`robot-line text-center whitespace-nowrap ${
                  i === 0
                    ? 'font-display text-[#f5f3ee] text-[7vw] sm:text-[5vw] md:text-[3.4vw] lg:text-[2.9vw] leading-none tracking-[-0.02em]'
                    : i === 1
                      ? 'font-display text-[#d7ff4f] text-[3.1vw] sm:text-[2.7vw] md:text-[2.1vw] lg:text-[1.75vw] leading-none tracking-[0.01em]'
                      : 'font-mono text-[#d7ff4f] text-[2.4vw] sm:text-[1.7vw] md:text-[1.05vw] lg:text-[0.9vw] tracking-[0.4em]'
                }`}
                style={{ visibility: 'hidden' }}
              />
            ))}
          </div>
        </div>
        )}

        {/* The way out: a scanline at the foot of the stage that appears with
            the surge and points down — follow the matrix code. Home rides it
            into Featured Work; About rides it into Experience. */}
        <div
          ref={guideRef}
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center gap-1 pb-2"
          style={{ visibility: 'hidden', opacity: 0 }}
          aria-hidden
        >
          <p className="font-mono text-[#d7ff4f] text-[10px] tracking-[0.5em] uppercase">
            continue
          </p>
          <span className="matrix-guide-caret block text-[#d7ff4f] text-sm leading-none">▼</span>
          <span className="block h-px w-full bg-gradient-to-r from-transparent via-[#d7ff4f]/70 to-transparent" />
        </div>

      </div>
    </div>
  );
};

export default WhatIDo;
