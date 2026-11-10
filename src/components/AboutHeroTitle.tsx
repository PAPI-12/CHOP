import React, { useEffect, useState } from 'react';
import SplitFlapSwap from './SplitFlapSwap';

/**
 * AboutHeroTitle — the hero headline.
 *
 *          ARCHITECTURE      756px @1280   the same width as SKELETON
 *    OF ART BUILT FROM THE   696px          one line, slightly smaller
 *          SKELETON          756px          the widest row, and the last to land
 *              ⒰             128px          the stem, centred
 *
 * THE is gone from the top: the line reads ARCHITECTURE OF ART BUILT FROM
 * THE SKELETON UP, so the leading THE was doing nothing but adding a row.
 * OF ART BUILT and FROM THE are one line now, which is what makes room for
 * ARCHITECTURE to come up to SKELETON's width.
 *
 * ARCHITECTURE is 12 characters against SKELETON's 8, so equal widths mean
 * very unequal type: 7.441vw against 10.9vw. Both measure 756px at 1280.
 * Neither row carries tracking, because the split-flap board sizes its tiles
 * from the raw advance widths and cannot apply letter-spacing — tracking the
 * plain state but not the flapped state would make the row jump width
 * mid-flip. So ARCHITECTURE is set tracking-normal throughout.
 *
 * The sequence, driven by `launched` (raised when the visitor presses Launch
 * Madness, lowered when the film ends):
 *
 *   idle     the title reads MADNESS in the bottom word row and holds there.
 *            Nothing flaps on a timer — MADNESS is simply what the page says
 *   launched the U and P lock together and grow rocket noses, and the block
 *            lifts off: gradually, then a creep, then it shoots out of frame
 *   falling  the film has ended and the block is on its way back down, and
 *            every row comes back as X's
 *   landing  the X's have touched down and split-flap into the real line —
 *            this is the first time SKELETON appears — and the U and P come
 *            apart again so the stem reads UP
 *
 * Colour keeps the homepage's order read top to bottom: bone, bone, tan, tan,
 * lime, lime. No scrim, no drop shadow, no rule.
 */

export type Layout = 'tree' | 'pyramid' | 'sketch' | 'stack' | 'centred' | 'split' | 'left';
export type Palette = 'homepage' | 'lime' | 'bone';

const PALETTES: Record<Palette, { word: string; lead: string; tail: string; tailFlip: string; knock: string }> = {
  homepage: { word: 'text-[#f5f3ee]', lead: 'text-[#d7c4aa]', tail: 'text-[#d7ff4f]', tailFlip: 'text-[#f5f3ee]', knock: 'text-[#f5f3ee]' },
  lime: { word: 'text-[#d7ff4f]', lead: 'text-[#d7c4aa]', tail: 'text-[#d7ff4f]', tailFlip: 'text-[#f5f3ee]', knock: 'text-[#f5f3ee]' },
  bone: { word: 'text-[#f5f3ee]', lead: 'text-[#f5f3ee]', tail: 'text-[#d7ff4f]', tailFlip: 'text-[#d7c4aa]', knock: 'text-[#f5f3ee]' },
};

// ARCHITECTURE carries no tracking — see the note above — and is sized so it
// measures exactly what SKELETON does: 5.42em at 10.9vw is 59.08 units, and
// 7.94em needs 7.441vw to cover the same ground. Both are 756px at 1280.
const T_ARCH = 'text-[clamp(1.64rem,7.44vw,3.62rem)] md:text-[clamp(2.27rem,7.44vw,7.99rem)]';
// OF ART BUILT FROM THE, one line, a shade under the two rows it sits
// between: 696px against their 756px.
const T_LINE = 'text-[clamp(0.93rem,4.21vw,2.05rem)] md:text-[clamp(1.28rem,4.21vw,4.52rem)]';
const T_SKEL = 'text-[clamp(2.4rem,10.9vw,5.31rem)] md:text-[clamp(3.32rem,10.9vw,11.7rem)]';
const T_UP = 'text-[clamp(2rem,9.1vw,4.43rem)] md:text-[clamp(2.78rem,9.1vw,9.8rem)]';

// Kept for the /_lab variants, which are temporary.
const T_THE = 'text-[clamp(2.2rem,10vw,4.9rem)] md:text-[clamp(3.05rem,10vw,10.8rem)]';
const T_ARTBUILT = 'text-[clamp(1.28rem,5.8vw,2.82rem)] md:text-[clamp(1.77rem,5.8vw,6.25rem)]';
const T_FROMTHE = 'text-[clamp(2.11rem,9.6vw,4.68rem)] md:text-[clamp(2.93rem,9.6vw,10.3rem)]';

const SMALL = 'block text-[clamp(1rem,2.4vw,1.75rem)] leading-[1.25] tracking-[-0.01em]';
const LEAD = 'leading-[0.88] tracking-[-0.04em] whitespace-nowrap';
// The three word rows are split-flap boards once the block returns, and a
// board sizes its own tiles, so it cannot inherit the tracking above.
const LEAD_FLAP = 'leading-[0.88] whitespace-nowrap';

// The launch runs in three legs — see the hero-launch keyframes: a gradual
// lift-off, a slower creep, then the shoot. It has to be clear of the frame
// before the film starts, so LAUNCH_MS in XrayHero is exactly this long.
const LAUNCH = 'animate-[hero-launch_1700ms_linear_forwards]';
const RETURN = 'animate-[hero-return_900ms_ease-out_forwards]';
// The block has to finish coming down before the X's are allowed to flap, or
// they flip in mid-air. Matches hero-return above.
const RETURN_MS = 900;

// How far out the P waits before the launch pulls it into the U. Docked it
// sits at -0.34em; this is clear of the U's right edge at 0.76em, so at rest
// the two letters read as separate rather than interlocked.
const P_UNDOCKED = 'translate-x-[0.55em]';

/**
 * One row of the headline.
 *
 * Four states, and the split-flap is mounted for the last two so that the
 * board is the same instance when `run` flips — remounting it would restart
 * the flip from scratch every time.
 *
 *   idle/launched  plain type. Before the first run the bottom row reads
 *                  MADNESS; after it, SKELETON
 *   falling        the board, holding X's
 *   landing        the same board, now running, so the X's flip to the word
 */
const FlapRow: React.FC<{
  /** the word the board is cut for, and what it flaps to */
  word: string;
  /** what the row says while it is plain type, when that differs */
  plain?: string;
  size: string;
  lead: string;
  colour: string;
  flip: string;
  board: boolean;
  run: boolean;
  startDelay?: number;
}> = ({ word, plain, size, lead, colour, flip, board, run, startDelay = 0 }) => {
  if (!board) {
    return <span className={`block ${size} ${lead} ${colour}`}>{plain ?? word}</span>;
  }
  return (
    <SplitFlapSwap
      from={'X'.repeat(word.length)}
      to={word}
      run={run}
      step={60}
      interval={72}
      startDelay={startDelay}
      settledClassName={colour}
      flippingClassName={flip}
      className={`block ${size} ${LEAD_FLAP}`}
    />
  );
};

/**
 * The U and P of "UP", woven into one mark.
 *
 * Three layers, so the two letters actually pass through each other rather
 * than one simply sitting on top of the other:
 *
 *   1. U        — behind everything
 *   2. P        — in front of the U
 *   3. U again  — in front of the P, but clipped to a horizontal band
 *
 * So the P laps over the U at the top and again at the foot of its bowl,
 * while the U crosses in front through the band between: the U passes
 * through the P, and the P passes through the back of the U.
 *
 * The measurements: at one size the U runs 0.76em wide with its counter open
 * from 0.15em to 0.60em. The P is pulled back 0.34em, which drops its stem at
 * 0.42em — inside that opening — and swings its bowl across the U's right
 * stem with 0.16em of overlap to weave through.
 *
 * `docked` brings the P in from `P_UNDOCKED` so the letters close on each
 * other; unlike the flap, it does NOT latch. The lock belongs to the launch,
 * so when the block lands the P slides back out and the stem reads UP again.
 * `rocket` grows a nose out of each letter, an arrow off the U's free stem
 * and one off the P's bowl, both rising clear of the cap height; those stand
 * down as soon as the launch is over.
 */
const UpLock: React.FC<{ u: string; p: string; docked?: boolean; rocket?: boolean }> = ({ u, p, docked, rocket }) => (
  <span
    className="relative inline-flex items-baseline tracking-normal"
    aria-label="UP"
    data-rocket={rocket ? 'true' : 'false'}
  >
    <span aria-hidden className={`relative ${u}`}>
      U
      {rocket && (
        <span
          aria-hidden
          data-nose="true"
          className={`${u} absolute -left-[0.035em] bottom-[0.78em] origin-bottom h-0 w-0 border-x-[0.11em] border-b-[0.2em] border-x-transparent border-b-current animate-[nose-pop_260ms_ease-out_180ms_both]`}
        />
      )}
    </span>
    <span
      aria-hidden
      data-docked={docked ? 'true' : 'false'}
      className={`relative ${p} -ml-[0.34em] transition-transform duration-[420ms] ease-out ${docked ? 'translate-x-0' : P_UNDOCKED}`}
    >
      P
      {rocket && (
        <span
          aria-hidden
          data-nose="true"
          className={`${p} absolute left-[0.30em] bottom-[0.78em] origin-bottom h-0 w-0 border-x-[0.11em] border-b-[0.2em] border-x-transparent border-b-current animate-[nose-pop_260ms_ease-out_180ms_both]`}
        />
      )}
    </span>
    <span aria-hidden className={`${u} absolute left-0 top-0 [clip-path:inset(25%_0_53%_0)]`}>
      U
    </span>
  </span>
);

type Props = {
  layout?: Layout;
  palette?: Palette;
  /** true from the moment the visitor launches until the film ends */
  launched?: boolean;
};

const AboutHeroTitle: React.FC<Props> = ({ layout = 'tree', palette = 'homepage', launched = false }) => {
  const pal = PALETTES[palette];

  // `flipped` is one-way: it means the film has run at least once. The page
  // must never go back to MADNESS once SKELETON has landed.
  const [flipped, setFlipped] = useState(false);
  useEffect(() => {
    if (launched) setFlipped(true);
  }, [launched]);

  // Flipped but no longer launched means the film has ended and the block is
  // on its way back down — that is the only time the return runs, so the
  // title does not fly in on first paint.
  const returning = flipped && !launched;
  // The X's hold until the block has actually touched down, then flap.
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (!returning) return;
    setRevealed(false);
    const t = window.setTimeout(() => setRevealed(true), RETURN_MS);
    return () => window.clearTimeout(t);
  }, [returning]);

  // The bottom row reads MADNESS until the X's have landed, and SKELETON
  // from then on. It hangs off `revealed`, NOT `flipped`: `flipped` goes true
  // the moment the visitor launches, which would swap MADNESS for SKELETON
  // while the block is still on its way up. Nothing is flapped into SKELETON
  // here — the X-flap is the only thing that ever writes it.

  if (layout === 'split') {
    return (
      <h1 className="h-full flex flex-col justify-between gap-10 md:gap-14 font-display items-center text-center">
        <span className={`block ${T_ARCH} ${LEAD} ${pal.word}`}>ARCHITECTURE</span>
        <span className="flex items-end justify-between gap-6 md:gap-10 w-full">
          <span className={`${SMALL} ${pal.lead}`}>OF ART BUILT FROM THE</span>
          <span className={`block ${T_UP} ${LEAD} ${pal.tail}`}>
            <UpLock u={pal.tail} p={pal.knock} docked={launched} rocket={launched} />
          </span>
        </span>
      </h1>
    );
  }

  if (layout === 'left' || layout === 'centred') {
    const cls = layout === 'left'
      ? 'h-full flex flex-col justify-center gap-[0.02em] font-display items-start text-left'
      : 'h-full flex flex-col justify-center gap-[0.02em] font-display items-center text-center';
    return (
      <h1 className={cls}>
        <span className={`block ${T_ARCH} ${LEAD} ${pal.word}`}>ARCHITECTURE</span>
        <span className={`block ${T_SKEL} ${LEAD} ${pal.lead}`}>OF ART BUILT</span>
        <span className={`block ${T_SKEL} ${LEAD} ${pal.lead}`}>FROM THE</span>
        <span className={`block ${T_UP} ${LEAD} ${pal.tail}`}>
          <UpLock u={pal.tail} p={pal.knock} docked={launched} rocket={launched} />
        </span>
      </h1>
    );
  }

  if (layout === 'stack') {
    return (
      <h1 className="h-full flex flex-col justify-center gap-[0.02em] font-display items-center text-center">
        <span className={`block ${T_ARCH} ${LEAD} ${pal.word}`}>ARCHITECTURE</span>
        <span className={`block ${T_ARTBUILT} ${LEAD} ${pal.lead}`}>OF ART BUILT</span>
        <span className={`block ${T_FROMTHE} ${LEAD} ${pal.lead}`}>FROM THE</span>
        <span className={`block ${T_SKEL} ${LEAD} ${pal.tail}`}>SKELETON</span>
        <span className={`block ${T_UP} ${LEAD} ${pal.tail}`}>
          <UpLock u={pal.tail} p={pal.knock} docked={launched} rocket={launched} />
        </span>
      </h1>
    );
  }

  if (layout === 'pyramid' || layout === 'sketch') {
    return (
      <h1 className="h-full flex flex-col justify-center gap-[0.02em] font-display items-center text-center">
        <span className={`block ${T_THE} ${LEAD} ${pal.word}`}>THE</span>
        <span className={`block ${T_ARCH} ${LEAD} ${pal.word}`}>ARCHITECTURE</span>
        <span className={`block ${T_ARTBUILT} ${LEAD} ${pal.lead}`}>OF ART BUILT</span>
        <span className={`block ${T_FROMTHE} ${LEAD} ${pal.lead}`}>FROM THE</span>
        <span className={`block ${T_SKEL} ${LEAD} ${pal.tail}`}>{revealed ? 'SKELETON' : 'MADNESS'}</span>
        <span className={`block ${T_UP} ${LEAD} ${pal.tail}`}>
          <UpLock u={pal.tail} p={pal.knock} docked={launched} rocket={launched} />
        </span>
      </h1>
    );
  }

  // tree — the shipped layout.
  //   ARCHITECTURE / OF ART BUILT FROM THE / SKELETON / UP
  // The boards are mounted only while the block is coming back, so the same
  // instance carries the X's down and then flips them.
  const board = returning;
  return (
    <h1
      data-launched={launched ? 'true' : 'false'}
      data-revealed={revealed ? 'true' : 'false'}
      className={`h-full flex flex-col justify-center font-display items-center text-center will-change-[transform,opacity] ${launched ? LAUNCH : returning ? RETURN : ''}`}
    >
      {/* LEAD_FLAP, not LEAD: these three rows become split-flap boards, a
          board sizes its tiles from the raw advance widths and cannot apply
          letter-spacing, so tracking them in the plain state would make each
          row visibly narrower the moment it flipped. Every width figure in
          this file assumes no tracking. */}
      <FlapRow
        word="ARCHITECTURE"
        size={T_ARCH}
        lead={LEAD_FLAP}
        colour={pal.word}
        flip={pal.tailFlip}
        board={board}
        run={revealed}
        startDelay={0}
      />
      <FlapRow
        word="OF ART BUILT FROM THE"
        size={T_LINE}
        lead={LEAD_FLAP}
        colour={pal.lead}
        flip={pal.tailFlip}
        board={board}
        run={revealed}
        startDelay={120}
      />
      {/* The bottom word: MADNESS as plain type, and the board is always cut
          for SKELETON so the X's are 8 wide on the way down. If the board
          took its target from the plain state it would be 7 tiles of X and
          grow an eighth the instant the flip started. */}
      <FlapRow
        word="SKELETON"
        plain={revealed ? undefined : 'MADNESS'}
        size={T_SKEL}
        lead={LEAD_FLAP}
        colour={pal.tail}
        flip={pal.tailFlip}
        board={board}
        run={revealed}
        startDelay={240}
      />
      {/* The stem: narrow, centred. The U and P lock for the launch and come
          apart again the moment the block lands, so it reads UP. */}
      <span className={`block ${T_UP} ${LEAD} ${pal.tail} mt-[1.2vh]`}>
        <UpLock u={pal.tail} p={pal.knock} docked={launched} rocket={launched} />
      </span>
    </h1>
  );
}

export default AboutHeroTitle;
