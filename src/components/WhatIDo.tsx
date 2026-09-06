import React, { useLayoutEffect, useRef } from 'react';

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
/** Fast off the mark, settling — the page transition's own curve. */
const expoOut = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/* ── The matrix arrives the way a page does ────────────────────────────
   Once the human lines have finished being typed, the code does not fade
   up. A hairline is struck across the stage — only AFTER the last
   character has landed, so the human text reveals the matrix code, never
   the other way round — and the rain opens out of it, symmetrically.
   That rain then carries over the section boundary: while the stage
   slides up out of view the code rains off its bottom edge and continues
   as Selected Work's own rain, which overlaps that section with raindrops
   until What I Do is completely out of view. */
/** The hairline is drawn for this long before the rectangle opens. */
const STRIKE_S = 0.22;
/** How long the rectangle takes to open to the full stage. */
const OPEN_S = 0.46;
/** Thickness of the struck line, in CSS pixels. */
const LINE_PX = 2;
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
   HOME — the full arc, scroll-driven then clock-driven:
     0.00 → 0.60  skills glide — UX/UI, ART DIRECTION … AI CREATIVE — one
                  after another, continuous, never pausing. ART COMES 1ST
                  rises last and parks at the front.
     0.62 → 0.72  ART COMES 1ST encodes — letters churn into matrix glyphs
                  left-to-right
     0.72 → 0.80  it browns out — supply gutters, glyphs swell and die
     T_BOOT       WHAT I DO · INITIALIZING decrypts (1.35s) — auto-played,
                  scroll-held. Then it vanishes.
     typing       the human lines read in the same place, one after another:
                  OH, HELLO / YOU CAN NOW CONTINUE TO FEATURED WORK /
                  FOLLOW THE MATRIX CODE — jittered cadence, breaths between
                  lines. Scrolling is held until the transmission is over.
     SPEAK_END    transition: the last character of FOLLOW THE MATRIX CODE
                  lands, the hairline strikes, the matrix rectangle opens
                  out of it and the surge rains down; "continue" lights,
                  and the pin hands off to Selected Work, where the cards
                  are cut out of the same code.
     The stream does not stop at the section boundary: while the stage
     slides up out of view the code rains off its bottom edge at hand-off
     strength and continues as Selected Work's own rain, which overlaps
     the section until What I Do is completely out of view.
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
const BOOT_TAG = 'WHAT I DO';

/**
 * One-shot, module-level: the machine transmission is experienced ONCE per
 * page load. After it plays, revisiting the section never shows the matrix
 * again — only a full reload re-initialises this module state. The wordmark
 * is deliberately NOT allowed to re-arm it.
 */
let machineActSpent = false;

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

/**
 * One lifecycle for both section-scoped canvases; scroll never re-renders React.
 *
 * `active` tells the other end the hand-off is live RIGHT NOW. `revealed` is a
 * one-way latch — once the visitor has crossed into the matrix phase it stays
 * true for the rest of the visit, so the code can keep raining over Selected
 * Work even after this section has scrolled out of view, and even if the human
 * text was rushed past. Selected Work reads it to continue the stream for the
 * whole of its own section, not just the overlap with What I Do.
 */
export type MatrixHandoff = {
  source: HTMLElement | null;
  active: boolean;
  revealed: boolean;
};

const WhatIDo: React.FC<{
  variant?: 'home' | 'about';
  matrixHandoffRef?: React.RefObject<MatrixHandoff>;
}> = ({ variant = 'home', matrixHandoffRef }) => {
  /**
   * home  — skills glide → ART COMES 1ST parks and encodes → it browns out,
   *         then WHAT I DO · INITIALIZING decrypts (auto-played, scroll-held),
   *         vanishes, the human lines read in the same place, and the surge
   *         reveals the matrix and hands off to Selected Work.
   * about — the practice only: the same glide, AI CREATIVE exits in white,
   *         then "continue" lights and Experience is pulled up. No machine.
   */
  const machineMode = variant !== 'about';
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rainRef = useRef<HTMLCanvasElement>(null);
  const rainLineRef = useRef<HTMLDivElement>(null);
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
  const lineRefs = useRef<Array<HTMLElement | null>>([]);
  const guideRef = useRef<HTMLDivElement>(null);
  // About-only: the hero→practice wipe's origin line (a vertical hairline
  // struck where the hero headline begins), plus the skill stack container
  // that is revealed through the growing opening.
  const revealLineRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);

  // Variant-resolved choreography values, captured by the effects below.
  const SCREENS = machineMode ? SCREENS_HOME : SCREENS_ABOUT;

  // Layout effect, not a passive one: the spacer / stage heights are written
  // before paint so the pin never gets a frame at its fallback size.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    const handoff = machineMode ? matrixHandoffRef?.current : undefined;
    if (handoff) handoff.source = root;
    const publishHandoff = (active: boolean) => {
      const value = String(active);
      if (root.dataset.matrixActive !== value) root.dataset.matrixActive = value;
      if (handoff) handoff.active = active;
    };
    const clearHandoff = () => {
      publishHandoff(false);
      if (handoff?.source === root) handoff.source = null;
    };
    publishHandoff(false);

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
    /** A remount after the transmission must not replay the one-shot rain. */
    let rainConsumed = machineActSpent;
    /**
     * Latched after the last human-readable line. Releasing the pin does NOT
     * end the hand-off: it stays live until the whole section leaves the
     * viewport, or the visitor scrolls back out of the matrix phase.
     */
    let handoffActive = false;
    /**
     * After the one-shot machine act is spent, coming back UP into the section
     * is a return, not a replay. The pin is retired and the section is cut down
     * to just the skills — no long black runway, no blank spot. `compact` flips
     * once, when the section re-enters the viewport from below after the act.
     */
    let compact = false;

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

    const consumeRain = () => {
      if (handoffActive) {
        rainConsumed = true;
        machineActSpent = true;
      }
      handoffActive = false;
      rainAlpha = 0;
      rainBoost = 0;
      publishHandoff(false);
      if (rainRef.current) rainRef.current.style.clipPath = 'inset(50% 0px 50% 0px)';
      resetAct();
    };

    /**
     * Retire the pin and collapse the section to the skills only. Used when the
     * visitor comes back UP into the section after the machine act has already
     * played: the code and rain are wiped, and the tall pinned runway is cut so
     * the return lands straight on the practice with no blank black space. This
     * mirrors the reduced-motion layout (which is the same static, readable list)
     * but keeps the live frame loop alive so Selected Work's own rain is
     * unaffected.
     */
    const enterCompact = () => {
      if (compact) return;
      compact = true;
      consumeRain();

      // Collapse the spacer so the section is only as tall as the skills.
      root.style.height = 'auto';
      stage.style.position = 'static';
      stage.style.height = 'auto';
      stage.style.overflow = 'visible';
      stage.style.paddingTop = '6rem';
      stage.style.paddingBottom = '4rem';

      // Return the absolute-positioned stack to normal flow, stacked.
      const listOuter = cards[0]?.parentElement?.parentElement;
      if (listOuter) { listOuter.style.position = 'static'; listOuter.style.padding = '0'; }
      const listHost = cards[0]?.parentElement;
      if (listHost) {
        listHost.style.height = 'auto';
        listHost.style.display = 'flex';
        listHost.style.flexDirection = 'column';
        listHost.style.alignItems = 'center';
        listHost.style.justifyContent = 'center';
        listHost.style.gap = '0.35rem';
      }
      cards.forEach((c, i) => {
        if (!c) return;
        c.style.position = 'relative';
        c.style.left = 'auto';
        c.style.top = 'auto';
        c.style.visibility = 'visible';
        c.style.opacity = '1';
        c.style.transform = 'none';
        // Fill in the plain title (the spans were wired for the encode/glide).
        const title = c.querySelector('h3');
        if (title && originals[i]) title.textContent = originals[i].join('');
      });
      notes.forEach((nEl) => { if (nEl) nEl.style.visibility = 'hidden'; });
      if (cueRef.current) cueRef.current.style.visibility = 'hidden';
      if (guideRef.current) guideRef.current.style.visibility = 'hidden';
      if (termRef.current) termRef.current.style.visibility = 'hidden';
      if (initRef.current) initRef.current.style.opacity = '0';
      if (headerRef.current) headerRef.current.style.opacity = '1';
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
      // Fire only after ART COMES 1ST has been seen and has browned out (the
      // encode/vanish window), only while the pin genuinely holds the stage,
      // and only once per page load. INITIALIZING is the first thing the
      // machine says after the motto, never at section entry.
      if (machineMode && actStart < 0 && !machineActSpent && p >= T_VANISH_END && p <= 0.995) {
        actStart = nowMs;
        armLock();
      }
      // Scrolled back above the trigger (or past the end) while the machine
      // was mid-act: reset so the section never shows a spent terminal when
      // revisited mid-sequence.
      if (machineMode && actStart > 0 && (p < T_VANISH_END - 0.05 || p > 0.995)) {
        resetAct();
      }
      const actT = machineMode && actStart > 0 ? (nowMs - actStart) / 1000 : 0;
      const acting = machineMode && actStart > 0 && actT <= ACT_DONE + 0.5;

      const initT = actT > 0 ? clamp01(actT / T_BOOT) : 0;
      const speakT = actT > T_BOOT + 0.35 ? 1 : 0; // arm flag; lines use their schedules
      const releaseT = actT > SPEAK_END ? smoothstep((actT - SPEAK_END) / 0.9) : 0;
      /**
       * The rain is the machine's ANSWER, so it may not start a frame before
       * the human-readable transmission has finished being typed. Everything
       * up to that point — the encode, the brownout, INITIALIZING, the three
       * spoken lines — plays on a clean stage.
       */
      const surgeT = actT > SPEAK_END ? smoothstep((actT - SPEAK_END) / 1.5) : 0;
      if (machineMode && !rainConsumed && actT > SPEAK_END) handoffActive = true;
      if (machineMode && actStart > 0 && actT > ACT_DONE) {
        // Transmission complete: release any hold and remember — the machine
        // plays once per visit, then the section belongs to scroll again.
        // (Touch devices are never held, so this is also where THEY mark the
        // act as spent; otherwise it replayed on every pass.)
        machineActSpent = true;
        disarmLock();
      }
      // The terminal clock may reset at the end of the pin, but the rain and
      // continue guide remain fully open throughout the section overlap.
      // While the clock is live, retain the original strike/open choreography.
      const spentZone = machineMode && handoffActive && actStart < 0 ? 1 : 0;

      // About exit: furniture fades as "continue" takes over the stage.
      const outT = machineMode ? 0 : smoothstep((p - 0.84) / 0.14);

      // About hero→practice wipe: a thin vertical hairline is struck at the
      // left margin where the hero headline begins, then a band opens out of
      // it — both edges expanding left and right simultaneously until the
      // width is ~100% of the viewport while the height is still a small
      // strip — and that strip then grows vertically until it covers the
      // viewport. The black is the section's own background (the What I Do
      // panel); the skills are revealed through the opening, sliding up and
      // fading 0→1 rather than simply being there. Scroll-driven over the
      // first slice of the pin. Home uses the matrix strike instead, so this
      // stays About-only.
      if (!machineMode) {
        const revealT = smoothstep(clamp01(p / 0.22));
        const stageEl = stageRef.current;
        if (stageEl) {
          const W = stageEl.clientWidth || window.innerWidth;
          const H = stageEl.clientHeight || window.innerHeight;
          // Where the hero headline begins — the About page's lime origin line.
          const originX = Math.min(96, Math.max(16, W * 0.055));
          const lineTh = LINE_PX;
          const phaseW = clamp01(revealT / 0.55);
          const phaseH = clamp01((revealT - 0.55) / 0.45);
          // Horizontal: both edges move outward from the origin line, left to
          // the viewport's left edge, right to its right, until full width.
          const leftEdge = originX - originX * phaseW;
          const rightEdge = originX + (W - originX) * phaseW;
          const pad = (lineTh / 2) * (1 - phaseW);
          const left = Math.max(0, leftEdge - pad);
          const right = Math.min(W, rightEdge + pad);
          // Vertical: a small centred strip, then it grows to cover the viewport.
          const strip = Math.max(lineTh, H * 0.016);
          const top = H / 2 - strip / 2 - (H / 2 - strip / 2) * phaseH;
          const bottom = H / 2 + strip / 2 + (H / 2 - strip / 2) * phaseH;
          const stack = stackRef.current;
          if (stack) {
            if (revealT >= 0.999) {
              stack.style.clipPath = 'none';
            } else {
              stack.style.clipPath = `inset(${Math.max(0, top).toFixed(1)}px ${Math.max(0, W - right).toFixed(1)}px ${Math.max(0, H - bottom).toFixed(1)}px ${Math.max(0, left).toFixed(1)}px)`;
            }
            stack.style.opacity = revealT.toFixed(3);
            stack.style.transform = `translate3d(0, ${((1 - revealT) * 14).toFixed(1)}px, 0)`;
          }
          // The origin line itself: a thin vertical lime hairline at the left,
          // brightest as the wipe is born, gone once the band has opened.
          const lineEl = revealLineRef.current;
          if (lineEl) {
            lineEl.style.left = `${left.toFixed(1)}px`;
            lineEl.style.opacity = String(Math.max(0, 1 - revealT * 2.6));
            lineEl.style.height = `${H}px`;
          }
        }
      }

      /**
       * The rain is the machine's ANSWER, and it is introduced the same way
       * a new page is: a struck hairline that opens into a rectangle. So the
       * canvas is CLIPPED open rather than faded in — clipping reveals the
       * code at its true size, where a fade would just dissolve it into
       * view and lose the architecture of the gesture entirely.
       */
      /**
       * The reveal is the human text's: the strike only begins once the
       * LAST character of the transmission has landed (SPEAK_END), and the
       * rectangle opens out of the strike. Before that instant there is
       * zero code on the stage — the text reveals the matrix, not before.
       */
      const revealT = machineMode && actStart > 0 && actT > SPEAK_END + STRIKE_S
        ? clamp01((actT - (SPEAK_END + STRIKE_S)) / OPEN_S)
        : 0;
      // Never re-clip the canvas when the pin releases. Only consuming the
      // hand-off (actual viewport exit / clearing the matrix) closes it.
      const opened = handoffActive ? (revealT > 0 ? expoOut(revealT) : spentZone) : 0;

      const rainEl = rainRef.current;
      if (rainEl) {
        if (opened <= 0) {
          rainEl.style.clipPath = 'inset(50% 0px 50% 0px)';
        } else if (opened >= 0.999) {
          rainEl.style.clipPath = 'none';
        } else {
          const halfStage = ch / 2;
          const half = LINE_PX / 2 + (halfStage - LINE_PX / 2) * opened;
          const inset = Math.max(0, halfStage - half);
          rainEl.style.clipPath = `inset(${inset.toFixed(1)}px 0px ${inset.toFixed(1)}px 0px)`;
        }
      }

      // The line itself: struck just before the opening, gone once the
      // rectangle has anywhere near enough height to speak for itself.
      const strikeT = machineMode && actStart > 0
        ? clamp01((actT - SPEAK_END) / STRIKE_S)
        : 0;
      const lineEl = rainLineRef.current;
      if (lineEl) {
        lineEl.style.opacity = String(
          opened > 0 ? Math.max(0, 1 - opened * 2.2) : strikeT,
        );
      }

      // Behind the clip the code is at full strength almost immediately —
      // the reveal is the clip's job, not the alpha's.
      const surgeA = actT > SPEAK_END ? smoothstep((actT - SPEAK_END) / 0.5) : 0;
      rainAlpha = machineMode && handoffActive ? Math.max(surgeA, spentZone) : 0;
      rainBoost = Math.max(surgeT, spentZone);

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
        dot.style.opacity = machineMode ? '0' : String(1 - outT);
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
        // The hint sits ABOVE the skills in both variants: it is visible
        // while the practice is being walked through, and it retires before
        // the motto parks at the front (Home) / before "continue" takes
        // over (About) — so the machine act never shares the stage with it.
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
          // Boot complete — the INITIALIZING word vanishes before the human
          // lines read, exactly as the sequence calls for.
          if (initRef.current.dataset.txt !== '') {
            initRef.current.dataset.txt = '';
            initRef.current.textContent = '';
          }
          initRef.current.style.opacity = '0';
        } else {
          initRef.current.style.opacity = '0';
          initRef.current.dataset.txt = '';
        }
      }

      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${(speakT > 0 ? 1 : initT).toFixed(3)})`;
        barRef.current.style.opacity = actT > 0 ? (speakT > 0 ? '0' : '1') : '0';
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

    /* ── Frame loop ─────────────────────────────────────────────────── */

    let raf = 0;
    let running = true;
    let onScreen = false;
    let lastT = 0;
    let lastProgress = -1;
    let rainDrawn = false;
    let rainTick = 0;

    const frame = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      if (!onScreen || document.hidden) { lastT = 0; return; }

      const dt = lastT ? Math.min((now - lastT) / 1000, 0.05) : 1 / 60;
      lastT = now;

      // One rect read per frame, shared by the progress, the stage-visibility
      // test — layout is only ever measured once.
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight;
      const travel = rect.height - vh;
      const p = travel > 0 ? clamp01(-rect.top / travel) : 0;
      const stageVisible = rect.bottom > 0 && rect.top < vh;

      // One-shot reveal latch. Crossing into the machine phase commits the
      // matrix to this visit: once it is true it stays true, so the code keeps
      // raining over Selected Work even if the human text was rushed past, and
      // even after this section has scrolled completely out of view. Selected
      // Work reads `revealed` to carry the stream for its own whole length.
      if (machineMode && handoff && p >= T_VANISH_END - 0.02 && !handoff.revealed) {
        handoff.revealed = true;
      }

      // Progress is clamped at 1 while the stage slides away, so this MUST be
      // checked every frame, not only in paint(). Even one visible pixel of
      // What I Do keeps both canvases raining at full hand-off strength.
      if (handoffActive && (!stageVisible || p < T_VANISH_END - 0.08)) {
        consumeRain();
        lastProgress = -1;
      }

      // Repaint on scroll movement, and repaint continuously ONLY while the
      // machine act is actually playing — it runs on its own clock, not on the
      // scroll. Once it has finished, a parked visitor costs nothing again.
      // In compact mode the stage is a static skills list, so paint never runs.
      const actLive =
        machineMode && actStart > 0 && (now - actStart) / 1000 <= ACT_DONE + 0.8;
      if (!compact && (Math.abs(p - lastProgress) > 0.0002 || actLive)) {
        lastProgress = p;
        paint(p, now);
      }

      // Selected Work reads the same latch. There is no exit fade, timer,
      // or second one-shot flag that can cut the rain off at the seam.
      publishHandoff(handoffActive && stageVisible);

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

    };

    /* ── Wiring ─────────────────────────────────────────────────────── */

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    measure();
    setupRain();
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
      return clearHandoff;
    }

    /**
     * A modest margin: the loop only has to be alive slightly before and
     * after the stage is on screen. Nothing this section draws survives past
     * its own edges any more, so there is nothing to keep running for.
     */
    const io = new IntersectionObserver(
      ([entry]) => {
        const wasOn = onScreen;
        onScreen = !!entry?.isIntersecting;
        // Coming back UP into the section after the one-shot act has played
        // (or after the matrix phase was reached) is a return, not a replay:
        // retire the pin and cut the section down to the skills so there is no
        // long blank black runway and no spent-machine stage.
        if (onScreen && !wasOn && machineMode && (machineActSpent || handoff?.revealed)) {
          enterCompact();
        }
        if (onScreen) {
          lastT = 0;
          // In compact mode the spacer is auto and the stage is static; the
          // pinned geometry no longer applies and must not be re-measured.
          if (!compact) { measure(); setupRain(); }
          lastProgress = -1;
        }
        // Also handle a fast jump that skips the last visible frame. The
        // completed hand-off stays consumed when scrolling back or revisiting.
        if (wasOn && !onScreen) consumeRain();
      },
      { rootMargin: '20% 0px 20% 0px' },
    );
    io.observe(root);

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (!compact) { measure(); setupRain(); }
        lastProgress = -1;
      }, 150);
    };
    window.addEventListener('resize', onResize, { passive: true });

    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      disarmLock();
      clearHandoff();
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      io.disconnect();
    };
  }, [machineMode, SCREENS, matrixHandoffRef]);

  return (
    // Tall spacer drives the pin; the stage inside is what stays on screen.
    // Heights are written in pixels by the layout effect — a pure-CSS unit
    // collapsing is how this section used to lose its lock and flash past.
    <div
      ref={rootRef}
      data-matrix-active="false"
      className="relative z-10 bg-[#000000]"
      style={{ height: machineMode ? '820vh' : '560vh' }}
    >
      <div
        ref={stageRef}
        className="sticky top-0 overflow-hidden bg-[#000000]"
        style={{ height: '100vh', minHeight: '480px', boxShadow: '0 -40px 80px rgba(0,0,0,0.45)', borderTop: '1px solid rgba(245,243,238,0.08)' }}
      >
        {/* The matrix background is SOLID black — the site's own
            #000000, no ambient washes. The code rain reads against pure
            black the way it does everywhere else on the site. */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d7ff4f]/35 to-transparent"
        />

        {/* Matrix rain sits behind the type on pure black.
            Home only — the About variant never wakes the machine. */}
        {/* The rain, and the hairline it opens out of. Same component parts
            as the page transition, same easing — one gesture the site reuses
            instead of two effects that merely rhyme. */}
        {machineMode && (
          <>
          <canvas
            ref={rainRef}
            className="matrix-rain pointer-events-none absolute inset-0 z-[2]"
            style={{ clipPath: 'inset(50% 0px 50% 0px)' }}
            aria-hidden
          />
          <div
            ref={rainLineRef}
            className="matrix-strike-line pointer-events-none absolute left-0 right-0 top-1/2 z-[3]"
            style={{ opacity: 0 }}
            aria-hidden
          />
          </>
        )}

        {/* About hero→practice wipe: a vertical lime hairline is struck at the
            left margin where the hero headline begins; a band opens out of it
            (both edges expanding left and right simultaneously) and that band
            grows vertically until it covers the viewport. The skills are
            revealed through the opening against the section's own black.
            Scroll-driven over the first slice of the pin. */}
        {!machineMode && (
          <div
            ref={revealLineRef}
            aria-hidden
            className="reveal-line pointer-events-none absolute top-0 bottom-0 z-[13]"
            style={{
              opacity: 0,
              width: LINE_PX,
              background:
                'linear-gradient(180deg, rgba(215,255,79,0) 0%, #f4ffd8 50%, rgba(215,255,79,0) 100%)',
              boxShadow: '0 0 18px rgba(215,255,79,0.55)',
            }}
          />
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
        <div ref={stackRef} className="reveal-stack absolute inset-0 z-10 flex items-center justify-center px-4 sm:px-6 lg:px-12">
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

          <div className="flex w-full max-w-[min(56rem,92vw)] flex-col items-center gap-4 md:gap-5">
            {ROBOT_LINES.map((line, i) => (
              /* The <p> is sized by an invisible copy of the FULL line, and the
                 typed characters are painted over it. Without that the box
                 grew character by character and, at this weight and size, the
                 whole transmission shuffled around while it was being typed. */
              <p
                key={line}
                className={`relative w-full text-center ${
                  i === 0
                    ? 'font-display font-black text-[#f5f3ee] text-[13vw] sm:text-[9.5vw] md:text-[6.2vw] lg:text-[5.2vw] leading-[0.95] tracking-[-0.03em]'
                    : i === 1
                      ? 'font-display font-black text-[#d7ff4f] text-[6.6vw] sm:text-[5.2vw] md:text-[3.6vw] lg:text-[3vw] leading-[1.05] tracking-[-0.01em]'
                      : 'font-mono font-bold text-[#d7ff4f] text-[4.2vw] sm:text-[3vw] md:text-[1.8vw] lg:text-[1.5vw] leading-[1.3] tracking-[0.26em]'
                }`}
              >
                <span aria-hidden className="invisible">{line}</span>
                <span
                  ref={(el) => { lineRefs.current[i] = el; }}
                  data-caret="false"
                  className="robot-line absolute inset-0 block"
                  style={{ visibility: 'hidden' }}
                />
              </p>
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
