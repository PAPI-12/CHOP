import React, { useCallback, useEffect, useRef, useState } from 'react';

/* ═══════════════════════════════════════════════════════════════════════
   One video component for the whole site.

   Every embed on the site used to be a raw <iframe> mounted with the page.
   That is where the errors came from:

   • `maxresdefault.jpg` does not exist for every upload. Four of the site's
     videos only publish up to `hqdefault`, so the poster resolved to a 404
     and the tile rendered as a grey box or a broken-image glyph.
   • Four third-party frames booted on page load, each pulling the YouTube
     player bundle and setting cookies, whether or not anyone pressed play.
     On a throttled connection that is what produced the spinner that never
     resolves and the "An error occurred" panel.
   • No `referrerpolicy`, which some deployments (and every privacy
     extension) treat as reason enough to refuse the embed.

   So: a facade. Nothing third-party loads until the visitor asks for it,
   the poster degrades through YouTube's real thumbnail ladder, the player
   is the cookie-less host with the exact parameters YouTube itself returns
   from oEmbed, and if the frame still has not reported back after a few
   seconds the visitor is handed a working link instead of a dead rectangle.
   ═══════════════════════════════════════════════════════════════════════ */

/** YouTube's thumbnail ladder, best first. Not every upload has every rung. */
export const thumbLadder = (id: string) => [
  `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
  `https://i.ytimg.com/vi/${id}/sddefault.jpg`,
  `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
];

export const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

/**
 * A poster image that walks down the thumbnail ladder instead of breaking.
 * Use anywhere a still of a video is needed outside of the player itself.
 */
export const VideoPoster: React.FC<{
  id: string;
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
}> = ({ id, alt, className, loading = 'lazy', fetchPriority = 'auto' }) => {
  const ladder = thumbLadder(id);
  const step = useRef(0);
  return (
    <img
      src={ladder[0]}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      referrerPolicy="no-referrer"
      onError={(e) => {
        step.current += 1;
        const next = ladder[step.current];
        if (next) e.currentTarget.src = next;
      }}
    />
  );
};

type Props = {
  /** YouTube video id. */
  id: string;
  /** Accessible title for the frame and the play button. */
  title: string;
  /** Wrapper classes. The component always fills its box. */
  className?: string;
  /** Optional local poster; falls back to YouTube's thumbnail ladder. */
  poster?: string;
  /** Skip the facade and mount the player immediately (used inside modals). */
  autoPlay?: boolean;
  /** Small line under the play button. */
  hint?: string;
};

const VideoEmbed: React.FC<Props> = ({
  id,
  title,
  className = '',
  poster,
  autoPlay = false,
  hint,
}) => {
  const [active, setActive] = useState(autoPlay);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef(0);

  const activate = useCallback(() => setActive(true), []);

  // If the player has not announced itself in a reasonable window, assume it
  // is blocked (extension, corporate proxy, offline) and offer the way out.
  useEffect(() => {
    if (!active || loaded) return;
    timer.current = window.setTimeout(() => setFailed(true), 7000);
    return () => window.clearTimeout(timer.current);
  }, [active, loaded]);

  const ladder = thumbLadder(id);
  const posterStep = useRef(0);

  return (
    <div className={`relative isolate h-full w-full overflow-hidden bg-[#0e0d0c] ${className}`}>
      {!active && (
        <button
          type="button"
          onClick={activate}
          className="group absolute inset-0 z-10 flex h-full w-full cursor-pointer items-center justify-center"
          aria-label={`Play video: ${title}`}
        >
          <img
            src={poster || ladder[0]}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={(e) => {
              if (poster && posterStep.current === 0) {
                posterStep.current = 1;
                e.currentTarget.src = ladder[0];
                return;
              }
              posterStep.current += 1;
              const next = ladder[posterStep.current];
              if (next) e.currentTarget.src = next;
              else e.currentTarget.style.opacity = '0';
            }}
          />
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/25 transition-opacity duration-500 group-hover:opacity-80"
          />
          <span className="relative z-10 flex flex-col items-center gap-3">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/85 shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-white md:h-20 md:w-20">
              <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-[#141210] md:h-7 md:w-7">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            {hint && (
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/70">
                {hint}
              </span>
            )}
          </span>
        </button>
      )}

      {active && (
        <>
          {!loaded && !failed && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0e0d0c]" aria-hidden>
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-[#d7ff4f]" />
            </div>
          )}
          <iframe
            className="absolute inset-0 h-full w-full border-0"
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1&color=white`}
            title={title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            onLoad={() => setLoaded(true)}
          />
          {failed && !loaded && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[#0e0d0c] px-6 text-center">
              <p className="max-w-sm text-sm leading-relaxed text-white/70">
                The embedded player could not start here — it is usually a browser
                extension or network policy blocking youtube.com.
              </p>
              <a
                href={watchUrl(id)}
                target="_blank"
                rel="noreferrer"
                className="border border-[#d7ff4f]/50 px-5 py-2 font-mono text-[10px] uppercase tracking-[0.3em] text-[#d7ff4f] transition-colors hover:bg-[#d7ff4f] hover:text-[#141210]"
              >
                Watch on YouTube
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VideoEmbed;
