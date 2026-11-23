/** Decorative Christmas backdrop: sky, stars, moon, falling snow and snowy pine hills. */
export function Scene() {
  return (
    <div className="scene" aria-hidden>
      <div className="scene-stars" />
      <div className="scene-moon" />
      <div className="scene-snow s3" />
      <Hills />
      <div className="scene-snow s1" />
      <div className="scene-snow s2" />
    </div>
  );
}

function Pine({ x, base, h, color }: { x: number; base: number; h: number; color: string }) {
  const w = h * 0.55;
  const tiers = [0, 0.3, 0.58];
  return (
    <g fill={color}>
      {tiers.map((t, i) => {
        const top = base - h + t * h;
        const bottom = base - h + (t + 0.48) * h;
        const half = (w / 2) * (0.6 + i * 0.22);
        return <path key={i} d={`M${x} ${top} L${x + half} ${bottom} L${x - half} ${bottom} Z`} />;
      })}
      <rect x={x - h * 0.035} y={base - h * 0.06} width={h * 0.07} height={h * 0.08} />
    </g>
  );
}

function Hills() {
  // viewBox is wide and sliced so it fills any screen width.
  const far = [40, 120, 175, 260, 330, 410, 470, 560, 640, 700, 790, 860, 930];
  const near = [20, 90, 230, 300, 520, 600, 760, 840, 960];
  return (
    <svg className="scene-hills" viewBox="0 0 1000 240" preserveAspectRatio="xMidYMax slice">
      {far.map((x, i) => (
        <Pine key={`f${i}`} x={x} base={176 + (i % 3) * 6} h={70 + ((i * 37) % 40)} color="var(--pine-far)" />
      ))}
      <path d="M0 180 Q 250 150 500 178 T 1000 172 V240 H0 Z" fill="var(--snow-ground)" opacity="0.85" />
      {near.map((x, i) => (
        <Pine key={`n${i}`} x={x} base={214 + (i % 2) * 6} h={95 + ((i * 53) % 45)} color="var(--pine-near)" />
      ))}
      <path d="M0 214 Q 300 190 600 212 T 1000 206 V240 H0 Z" fill="var(--snow-ground)" />
    </svg>
  );
}

/** A string of Christmas lights that hangs across the top of the page. */
export function Garland() {
  const bulbs = Array.from({ length: 13 }, (_, i) => i);
  const colors = ["#e8344e", "#f2c45a", "#3fbf7f", "#7fc8ff", "#fff3d6"];
  // Points on the two quadratic arcs of the wire: y = 6 + 92·u·(1−u).
  const y = (t: number) => {
    const u = ((t * 400) % 200) / 200;
    return 6 + 92 * u * (1 - u);
  };
  return (
    <svg className="garland pointer-events-none mx-auto block w-full max-w-lg" viewBox="-12 0 424 66" aria-hidden>
      <path
        d="M0 6 Q 100 52 200 6 Q 300 52 400 6"
        fill="none"
        stroke="var(--label3)"
        strokeOpacity="0.6"
        strokeWidth="1.5"
      />
      {bulbs.map((i) => {
        const t = i / (bulbs.length - 1);
        const x = t * 400;
        const yy = y(t);
        const c = colors[i % colors.length];
        return (
          <g key={i} className="bulb">
            <rect x={x - 2.5} y={yy - 4} width="5" height="5" rx="1" fill="var(--label3)" />
            <ellipse cx={x} cy={yy + 6} rx="4.5" ry="6.5" fill={c} />
            <ellipse cx={x} cy={yy + 6} rx="10" ry="12" fill={c} opacity="0.18" />
          </g>
        );
      })}
    </svg>
  );
}

export function Bow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="bowGold" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f8dc8c" />
          <stop offset="1" stopColor="#c98f22" />
        </linearGradient>
      </defs>
      <path d="M60 36 C 40 4, 6 6, 10 30 C 13 48, 40 46, 60 36 Z" fill="url(#bowGold)" />
      <path d="M60 36 C 80 4, 114 6, 110 30 C 107 48, 80 46, 60 36 Z" fill="url(#bowGold)" />
      <path d="M56 38 L 38 62 L 48 60 L 52 64 L 60 40 Z" fill="#c98f22" />
      <path d="M64 38 L 82 62 L 72 60 L 68 64 L 60 40 Z" fill="#c98f22" />
      <path d="M22 26 C 30 16, 44 18, 54 32" fill="none" stroke="#a8721a" strokeWidth="2" opacity="0.5" />
      <path d="M98 26 C 90 16, 76 18, 66 32" fill="none" stroke="#a8721a" strokeWidth="2" opacity="0.5" />
      <ellipse cx="60" cy="36" rx="10" ry="9" fill="#e4ad3e" />
      <ellipse cx="57" cy="33" rx="4" ry="3" fill="#fbe7b0" opacity="0.7" />
    </svg>
  );
}
