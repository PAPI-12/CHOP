import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * XrayHero — the moving layer of the About hero.
 *
 * The hero idles on a still: the first frame of the sequence, held in the
 * site's grayscale study treatment so it reads exactly like the photograph it
 * replaces. Nothing is fetched beyond that poster until the visitor asks for
 * it — the encode is ~5.5 MB and it should never sit in front of first paint.
 * Pressing the control engages "x-ray mode": the video fades up in colour,
 * runs the sequence, and then HOLDS on its last frame, which is the end card
 * in x-ray. So the hero settles into a second still rather than snapping back.
 *
 * Two encodes, VP9 first: at equal quality VP9 holds the film grain that
 * x264 throws away, and it does it in ~60% of the bytes. The H.264 is there
 * for Safari versions that predate VP9.
 */

const SRC_WEBM = '/videos/about-hero-xray.webm';
const SRC_MP4 = '/videos/about-hero-xray.mp4';
const SRC_POSTER = '/videos/about-hero-xray-poster.jpg';

type Phase = 'idle' | 'loading' | 'playing' | 'ended';

const LABEL: Record<Phase, string> = {
  idle: 'X-ray mode',
  loading: 'Warming up',
  playing: 'X-ray live',
  ended: 'Run it again',
};

const XrayHero: React.FC<{ className?: string }> = ({ className = '' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);

  // Warm the file once the main thread is idle. The poster carries first
  // paint; the encode only starts when there is genuinely spare capacity, so
  // the button is live by the time anyone reaches for it.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    let id: number | undefined;
    let timer: number | undefined;
    const warm = () => {
      v.preload = 'auto';
    };
    const ric = (window as unknown as {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    }).requestIdleCallback;
    if (typeof ric === 'function') {
      id = ric(warm, { timeout: 4000 });
    } else {
      timer = window.setTimeout(warm, 1200);
    }
    return () => {
      if (id !== undefined) (window as any).cancelIdleCallback?.(id);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  const engage = useCallback(async () => {
    const v = videoRef.current;
    if (!v || phase === 'playing') return;
    if (phase === 'ended') v.currentTime = 0;
    setPhase('loading');
    try {
      await v.play();
    } catch {
      // Autoplay refused or the source is unavailable — fall back to the
      // still rather than leaving a dead control on the page.
      setPhase('idle');
    }
  }, [phase]);

  return (
    <>
      {/* The idle state: frame one, held as a grayscale study. Matches the
          treatment the photograph it replaces was carrying. */}
      <img
        loading="eager"
        decoding="async"
        src={SRC_POSTER}
        alt=""
        width={1280}
        height={720}
        aria-hidden
        className={`absolute inset-0 h-full w-full object-cover grayscale contrast-[1.04] brightness-[0.95] transition-opacity duration-700 ${
          phase === 'idle' ? 'opacity-100' : 'opacity-0'
        } ${className}`}
      />

      {/* The sequence. Holds its last frame when it ends. */}
      <video
        ref={videoRef}
        poster={SRC_POSTER}
        preload="none"
        muted
        playsInline
        aria-hidden
        tabIndex={-1}
        onPlaying={() => setPhase('playing')}
        onWaiting={() => setPhase((p) => (p === 'ended' ? p : 'loading'))}
        onEnded={() => setPhase('ended')}
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          if (el.duration > 0) setProgress(el.currentTime / el.duration);
        }}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
          phase === 'playing' || phase === 'ended' ? 'opacity-100' : 'opacity-0'
        } ${className}`}
      >
        <source src={SRC_WEBM} type="video/webm" />
        <source src={SRC_MP4} type="video/mp4" />
      </video>

      {/* The control. Bottom-right of the hero, above the corner
          registration — out of the way of the headline plate. */}
      <div className="absolute z-20 bottom-14 right-4 sm:right-6 lg:right-12 xl:right-24 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={engage}
          aria-pressed={phase === 'playing' || phase === 'ended'}
          className="group inline-flex items-center gap-2.5 border border-[#d7ff4f]/45 bg-[#000]/55 px-3 py-2 font-mono text-[9px] md:text-[10px] font-bold tracking-[0.3em] uppercase text-[#d7ff4f] backdrop-blur-[2px] transition-colors duration-200 hover:border-[#d7ff4f] hover:bg-[#d7ff4f] hover:text-[#000000] focus-visible:outline-none focus-visible:border-[#d7ff4f] focus-visible:bg-[#d7ff4f] focus-visible:text-[#000000]"
        >
          <span
            aria-hidden
            className={`h-1.5 w-1.5 shrink-0 rounded-full bg-[#d7ff4f] group-hover:bg-[#000000] ${
              phase === 'playing' ? 'animate-pulse' : ''
            } ${phase === 'loading' ? 'opacity-40' : ''}`}
          />
          {LABEL[phase]}
        </button>

        {/* Playback hairline — only while there is something to track. */}
        <div
          aria-hidden
          className={`h-px w-[132px] bg-[#f5f3ee]/15 overflow-hidden transition-opacity duration-300 ${
            phase === 'playing' || phase === 'ended' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className="h-full bg-[#d7ff4f] origin-left transition-[transform] duration-200 ease-linear"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
      </div>
    </>
  );
};

export default XrayHero;
