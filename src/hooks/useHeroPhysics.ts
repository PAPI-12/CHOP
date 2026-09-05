import { useEffect, type RefObject } from 'react';

/**
 * Zero-gravity hero bodies.
 *
 * Every glyph in the hero headline (and the ambient scribbles) is a free body
 * floating in the hero rectangle. There is no gravity and no spring back to a
 * home position: once you knock a letter, it keeps drifting until something
 * stops it. Impulse is proportional to real cursor speed, so a flick sends a
 * letter across the section and a slow nudge barely moves it.
 *
 * Design notes that matter for correctness:
 *
 * - Bodies are driven purely by `transform` from a measured home position, so
 *   the DOM never reflows while things are moving.
 * - The cursor is swept as a *segment* (last position -> current position), not
 *   a point. At 144Hz a fast flick can jump 200px between frames; point testing
 *   would tunnel straight through a letter and the hit would silently be lost.
 *   That tunnelling was the "letters malfunction" glitch.
 * - Integration uses a fixed timestep accumulator. Variable dt with bouncing
 *   walls is what made letters occasionally explode or stick in a wall.
 * - Positions are clamped *after* the bounce resolve, so a body can never end a
 *   frame outside the hero box, which is what caused letters to vanish.
 */

type Body = {
  el: HTMLElement;
  kind: 'letter' | 'deco';
  /** Centre of the body at rest, in hero-local coordinates. */
  homeX: number;
  homeY: number;
  homeRot: number;
  /** Offset from home. */
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  /** Collision half-extents. */
  hw: number;
  hh: number;
  radius: number;
  invMass: number;
  moved: boolean;
  /** Stable identity for per-body eraser stroke tracking. */
  key: number;
  /** Radius of the trail this body carves into the overlay. */
  trailR: number;
};

/** Per-second velocity retained. Near 1 = space-like drift. */
const DRAG = 0.2;
const ANGULAR_DRAG = 0.12;
/** Wall restitution. Low enough that a letter cannot ping-pong for seconds. */
const BOUNCE = 0.42;
const MAX_SPEED = 2600;
const MAX_VR = 260;
/** Fixed physics step (seconds). */
const STEP = 1 / 120;
const MAX_STEPS = 5;
/** Cursor speed (px/s) -> impulse scaling. */
const IMPULSE = 0.85;
const MIN_IMPULSE_SPEED = 40;

/* ── Regrouping ───────────────────────────────────────────────────────────
   Zero-g drift reads as "broken" if it never ends, so after the pointer has
   been still for IDLE_DELAY the bodies ease back into the headline. The pull
   ramps in over REGROUP_RAMP rather than switching on, so letters glide home
   instead of snapping. Any new cursor impulse cancels it instantly.        */
const IDLE_DELAY = 1.1;
const REGROUP_RAMP = 1.3;
/** Spring constant and damping used while regrouping. */
const HOME_STIFF = 26;
const HOME_DAMP = 8.5;
/** Below this offset/velocity a regrouping body is snapped home and parked. */
const SETTLE_DIST = 0.4;
const SETTLE_SPEED = 4;

const clamp = (v: number, min: number, max: number) => (v < min ? min : v > max ? max : v);

const readRotation = (el: HTMLElement) => {
  const t = getComputedStyle(el).transform;
  if (!t || t === 'none') return 0;
  try {
    const m = new DOMMatrixReadOnly(t);
    return Math.atan2(m.b, m.a) * (180 / Math.PI);
  } catch {
    return 0;
  }
};

/** Shortest distance from point p to segment ab. */
const pointSegmentDistance = (
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
) => {
  const abx = bx - ax;
  const aby = by - ay;
  const len2 = abx * abx + aby * aby;
  let t = 0;
  if (len2 > 1e-6) t = clamp(((px - ax) * abx + (py - ay) * aby) / len2, 0, 1);
  const cx = ax + abx * t;
  const cy = ay + aby * t;
  return { dist: Math.hypot(px - cx, py - cy), cx, cy };
};

export type HeroCursor = {
  /** Hero-local coordinates of the ring centre. */
  x: number;
  y: number;
  /** Ring radius in px. */
  r: number;
  /** False until the visitor has actually moved the pointer. */
  active: boolean;
};

export type HeroPhysicsOptions = {
  /**
   * Single source of truth for the pusher. The hero writes the ring's spring
   * position here once per frame, so the ring you see, the area it erases and
   * the thing that hits letters are literally the same coordinates — they
   * cannot drift apart.
   */
  cursorRef: { current: HeroCursor };
  /**
   * Called once per frame for every body displaced from home, so the hero can
   * carve the overlay along the letter's path exactly like the ring does. Held
   * in a ref so changing the callback never restarts the solver.
   */
  onBodyTrail?: { current: ((key: number, x: number, y: number, r: number) => void) | null };
};

export function useHeroPhysics(
  heroRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  options: HeroPhysicsOptions,
) {
  const { cursorRef, onBodyTrail } = options;

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || !enabled) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(pointer: fine)').matches || !window.matchMedia('(hover: hover)').matches) return;

    let bodies: Body[] = [];
    let heroW = 0;
    let heroH = 0;
    let boxLeft = 0;
    let boxTop = 0;
    let raf = 0;
    let lastFrame = 0;
    let accumulator = 0;
    let running = true;
    let onScreen = true;
    let resizeTimer = 0;

    // Cursor sweep, sampled from the shared ref once per frame.
    let prevX = 0;
    let prevY = 0;
    let curX = 0;
    let curY = 0;
    let ringR = 24;
    let cursorLive = false;
    /** Seconds since the pointer last moved meaningfully. Drives regrouping. */
    let idleFor = 0;

    const syncBox = () => {
      const r = hero.getBoundingClientRect();
      boxLeft = r.left;
      boxTop = r.top;
      heroW = r.width;
      heroH = r.height;
    };

    const measure = () => {
      syncBox();
      const els = Array.from(hero.querySelectorAll<HTMLElement>('[data-hero-physics]'));
      const next: Body[] = [];

      for (const el of els) {
        // Clear any previous transform so we measure the true resting box.
        el.style.transform = '';
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        if (getComputedStyle(el).display === 'none') continue;

        const kind: Body['kind'] = el.dataset.heroPhysics === 'deco' ? 'deco' : 'letter';
        const hw = r.width * 0.5;
        const hh = r.height * 0.5;

        // Glyph boxes are tall and mostly empty (line-height). Tighten the
        // collision shape to the ink so letters do not react to near misses.
        const collideHw = kind === 'letter' ? Math.max(hw * 0.78, 6) : hw;
        const collideHh = kind === 'letter' ? Math.max(hh * 0.5, 6) : hh;

        next.push({
          el,
          kind,
          homeX: r.left - boxLeft + hw,
          homeY: r.top - boxTop + hh,
          homeRot: readRotation(el),
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          rot: 0,
          vr: 0,
          hw: collideHw,
          hh: collideHh,
          radius: Math.max(collideHw, collideHh),
          invMass: kind === 'deco' ? 1.6 : 1,
          moved: false,
          key: next.length,
          // Letters carve roughly their own ink width; scribbles a little less.
          trailR: Math.max(kind === 'letter' ? collideHw * 0.95 : collideHw * 0.7, 10),
        });

        el.style.willChange = 'transform';
      }

      bodies = next;
    };

    measure();

    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    fonts?.ready.then(() => { if (running) measure(); }).catch(() => {});

    const scheduleMeasure = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (!running) return;
        // A resize invalidates every home position; reset so nothing is
        // stranded outside the new box.
        bodies.forEach((b) => {
          b.el.style.transform = '';
          b.x = 0; b.y = 0; b.vx = 0; b.vy = 0; b.rot = 0; b.vr = 0; b.moved = false;
        });
        measure();
      }, 140);
    };

    window.addEventListener('resize', scheduleMeasure, { passive: true });
    window.addEventListener('orientationchange', scheduleMeasure, { passive: true });

    let scrollTick = false;
    const onScroll = () => {
      if (scrollTick) return;
      scrollTick = true;
      requestAnimationFrame(() => { scrollTick = false; syncBox(); });
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const io = new IntersectionObserver(([entry]) => {
      onScreen = !!entry?.isIntersecting;
      if (onScreen) syncBox();
    }, { rootMargin: '120px' });
    io.observe(hero);

    /** Sample the shared ring position and build this frame's sweep segment. */
    const sampleCursor = () => {
      const c = cursorRef.current;
      ringR = c.r;
      if (!c.active) { cursorLive = false; return false; }
      if (!cursorLive) {
        cursorLive = true;
        prevX = c.x; prevY = c.y; curX = c.x; curY = c.y;
        return false;
      }
      prevX = curX;
      prevY = curY;
      curX = c.x;
      curY = c.y;
      return true;
    };

    /** Apply the cursor sweep for this frame. */
    const applyCursor = (dt: number, hasSegment: boolean) => {
      if (!hasSegment) return;

      const dx = curX - prevX;
      const dy = curY - prevY;
      const travel = Math.hypot(dx, dy);
      const speed = travel / Math.max(dt, 1e-4);
      if (speed < MIN_IMPULSE_SPEED) return;

      // A real move: cancel any regrouping in progress and re-arm the timer.
      idleFor = 0;

      const sweepR = Math.max(ringR, 8);
      const nx = travel > 1e-4 ? dx / travel : 0;
      const ny = travel > 1e-4 ? dy / travel : 0;

      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        const bx = b.homeX + b.x;
        const by = b.homeY + b.y;

        const { dist, cx, cy } = pointSegmentDistance(bx, by, prevX, prevY, curX, curY);
        const reach = sweepR + b.radius;
        if (dist > reach) continue;

        // Closer to the centre of the sweep = stronger hit, so glancing blows
        // feel like glancing blows.
        const falloff = 1 - dist / reach;
        const power = speed * IMPULSE * falloff * b.invMass;

        // Push along travel direction, plus a radial component so the letter
        // is genuinely shoved off the cursor rather than dragged along it.
        let rx = bx - cx;
        let ry = by - cy;
        const rlen = Math.hypot(rx, ry);
        if (rlen > 1e-4) { rx /= rlen; ry /= rlen; } else { rx = -ny; ry = nx; }

        b.vx += nx * power * 0.78 + rx * power * 0.42;
        b.vy += ny * power * 0.78 + ry * power * 0.42;

        // Torque from the off-centre component of the hit.
        b.vr += clamp((rx * ny - ry * nx) * power * 0.05, -MAX_VR, MAX_VR);
        // Waking a retired body: re-arm compositing before it moves again.
        if (!b.moved) {
          b.moved = true;
          b.el.style.willChange = 'transform';
        }
      }
    };

    const integrate = (dt: number) => {
      const dragF = Math.pow(DRAG, dt);
      const angDragF = Math.pow(ANGULAR_DRAG, dt);

      // 0 while the visitor is active, ramping to 1 once the pointer has been
      // still long enough. Scales the homing spring so it fades in smoothly.
      const pull = clamp((idleFor - IDLE_DELAY) / REGROUP_RAMP, 0, 1);

      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        if (!b.moved) continue;

        if (pull > 0) {
          // Critically-damped pull back to the letter's home position and
          // rotation. This is what makes the headline reassemble itself.
          const k = HOME_STIFF * pull;
          const c = HOME_DAMP * pull;
          b.vx += (-k * b.x - c * b.vx) * dt;
          b.vy += (-k * b.y - c * b.vy) * dt;
          b.vr += (-k * b.rot - c * b.vr) * dt;
        }

        b.vx *= dragF;
        b.vy *= dragF;
        b.vr *= angDragF;

        const spd = Math.hypot(b.vx, b.vy);
        if (spd > MAX_SPEED) {
          const s = MAX_SPEED / spd;
          b.vx *= s;
          b.vy *= s;
        }
        b.vr = clamp(b.vr, -MAX_VR, MAX_VR);

        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.rot += b.vr * dt;

        // Resolve against the hero walls, then hard-clamp. A body can never
        // finish a step outside the box.
        let px = b.homeX + b.x;
        let py = b.homeY + b.y;
        const minX = b.hw;
        const maxX = heroW - b.hw;
        const minY = b.hh;
        const maxY = heroH - b.hh;

        if (maxX > minX) {
          if (px < minX) { px = minX; b.vx = Math.abs(b.vx) * BOUNCE; b.vr *= 0.7; }
          else if (px > maxX) { px = maxX; b.vx = -Math.abs(b.vx) * BOUNCE; b.vr *= 0.7; }
        } else {
          px = clamp(px, 0, heroW);
        }
        if (maxY > minY) {
          if (py < minY) { py = minY; b.vy = Math.abs(b.vy) * BOUNCE; b.vr *= 0.7; }
          else if (py > maxY) { py = maxY; b.vy = -Math.abs(b.vy) * BOUNCE; b.vr *= 0.7; }
        } else {
          py = clamp(py, 0, heroH);
        }

        b.x = px - b.homeX;
        b.y = py - b.homeY;

        const speed = Math.hypot(b.vx, b.vy);

        if (pull > 0) {
          // Regrouping: once the body is home and slow, snap it exactly onto
          // its home position and retire it. `moved = false` takes it out of
          // the integrate/render loops entirely, so a settled headline costs
          // nothing per frame and cannot jitter.
          if (Math.hypot(b.x, b.y) < SETTLE_DIST && Math.abs(b.rot) < 0.4 && speed < SETTLE_SPEED) {
            b.x = 0; b.y = 0; b.rot = 0;
            b.vx = 0; b.vy = 0; b.vr = 0;
            b.moved = false;
            b.el.style.transform = '';
            b.el.style.willChange = '';
          }
        } else if (speed < 1.5 && Math.abs(b.vr) < 1) {
          // Not regrouping yet: just kill imperceptible sub-pixel drift.
          b.vx = 0; b.vy = 0; b.vr = 0;
        }
      }
    };

    const render = () => {
      const trail = onBodyTrail?.current ?? null;
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        if (!b.moved) continue;
        b.el.style.transform =
          `translate3d(${b.x.toFixed(2)}px, ${b.y.toFixed(2)}px, 0) rotate(${(b.homeRot + b.rot).toFixed(2)}deg)`;

        // Only bodies actually displaced from home carve the overlay, so the
        // headline never pre-erases its own footprint on load.
        if (trail && (b.x * b.x + b.y * b.y) > 4) {
          trail(b.key, b.homeX + b.x, b.homeY + b.y, b.trailR);
        }
      }
    };

    const frame = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(frame);

      if (!onScreen || document.hidden) {
        lastFrame = 0;
        accumulator = 0;
        cursorLive = false;
        return;
      }

      const elapsed = lastFrame ? (now - lastFrame) / 1000 : STEP;
      lastFrame = now;
      // A tab return or a long task must never dump a huge dt into the solver.
      accumulator = Math.min(accumulator + elapsed, STEP * MAX_STEPS);

      // One sweep per rendered frame, applied once, then simulated forward.
      const hasSegment = sampleCursor();
      applyCursor(Math.max(elapsed, 1e-4), hasSegment);
      idleFor += elapsed;

      let steps = 0;
      while (accumulator >= STEP && steps < MAX_STEPS) {
        integrate(STEP);
        accumulator -= STEP;
        steps++;
      }

      render();
    };

    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('orientationchange', scheduleMeasure);
      window.removeEventListener('scroll', onScroll);
      io.disconnect();
      bodies.forEach((b) => {
        b.el.style.transform = '';
        b.el.style.willChange = '';
      });
    };
  }, [heroRef, enabled, cursorRef, onBodyTrail]);
}
