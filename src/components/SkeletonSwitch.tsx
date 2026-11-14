import React, { useEffect, useRef, useState } from 'react';

/**
 * SkeletonSwitch — the on/off control for a section's skeleton mode.
 *
 * The idea it is built on: the About page reads as "the architecture of art
 * built from the skeleton up", so every section has two states — the finished
 * surface, and the structure underneath it. This is how you move between
 * them, and each section keeps its own.
 *
 * It is deliberately built as a piece of equipment rather than a web form
 * control: a track with a detent, a knob that carries a lime charge when it
 * is live, and a scan that sweeps the track on every throw. The sweep is the
 * only animation and it is short — it reads as the machine checking itself,
 * not as decoration.
 */

const BONE = '#f5f3ee';
const LIME = '#d7ff4f';

type Props = {
  /** whether the section is currently showing its structure */
  on: boolean;
  onChange: (next: boolean) => void;
  /** what the switch governs, for screen readers */
  label?: string;
  /** visible word beside the track; hidden on small screens if `compact` */
  word?: string;
  /** drop the word and keep only the track */
  compact?: boolean;
  className?: string;
  /** flips the order so the word sits left of the track */
  flip?: boolean;
};

const SkeletonSwitch: React.FC<Props> = ({
  on,
  onChange,
  label = 'Skeleton mode',
  word = 'Skeleton',
  compact = false,
  className = '',
  flip = false,
}) => {
  // The scan is re-armed on every throw, including throwing it back off, so
  // the sweep always reads as a fresh check rather than a state indicator.
  // The key is what restarts it: re-rendering with the same key would not.
  const [pulse, setPulse] = useState(0);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setPulse((p) => p + 1);
  }, [on]);

  const track: React.CSSProperties = {
    width: 46,
    height: 22,
    borderRadius: 999,
    border: `1px solid ${on ? 'rgba(215,255,79,0.55)' : 'rgba(245,243,238,0.22)'}`,
    background: on ? 'rgba(215,255,79,0.07)' : 'rgba(245,243,238,0.03)',
    transition: 'border-color 260ms ease, background-color 260ms ease',
  };

  const knob: React.CSSProperties = {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 14,
    height: 14,
    borderRadius: 999,
    background: on ? LIME : 'rgba(245,243,238,0.45)',
    boxShadow: on ? `0 0 10px ${'rgba(215,255,79,0.5)'}` : 'none',
    transform: on ? 'translateX(24px)' : 'translateX(0)',
    transition: 'transform 320ms cubic-bezier(0.34, 1.32, 0.64, 1), background-color 260ms ease, box-shadow 260ms ease',
  };

  const wordStyle: React.CSSProperties = {
    color: on ? LIME : 'rgba(245,243,238,0.5)',
    transition: 'color 260ms ease',
  };

  const inner = (
    <>
      <span
        aria-hidden
        style={{ ...track, position: 'relative', flex: '0 0 auto', overflow: 'hidden' }}
      >
        <span style={knob} />
        {/* The scan. Keyed on `pulse` so each throw restarts it. */}
        {pulse > 0 && (
          <span
            key={pulse}
            aria-hidden
            className="skel-scan"
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(90deg, transparent 0%, rgba(215,255,79,0.55) 50%, transparent 100%)',
            }}
          />
        )}
      </span>
      {!compact && (
        <span
          className="font-mono text-[9px] md:text-[10px] tracking-[0.35em] uppercase leading-none select-none"
          style={wordStyle}
        >
          {word}
        </span>
      )}
    </>
  );

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`group inline-flex items-center gap-2.5 md:gap-3 outline-none ${className}`}
      style={{
        flexDirection: flip ? 'row-reverse' : 'row',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {inner}
      {/* Focus ring that matches the rest of the site's controls. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-2 rounded-full opacity-0 group-focus-visible:opacity-100"
        style={{ boxShadow: `0 0 0 1px ${LIME}` }}
      />
    </button>
  );
};

export default SkeletonSwitch;

// Kept next to the component so the colours above stay the single source:
// bone is the surface, lime is the charge, and both come from the hero
// palette rather than being restated here.
export const SKELETON_PALETTE = { bone: BONE, lime: LIME } as const;
