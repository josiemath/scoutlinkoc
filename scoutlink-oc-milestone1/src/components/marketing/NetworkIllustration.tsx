/**
 * Original decorative illustration: troops as stitched badges across three
 * soft regions, linked by dashed trails. Purely decorative (aria-hidden); the
 * nodes are not real troops.
 */

type Node = { x: number; y: number; r: number; tone: "primary" | "dark" | "mint"; glyph?: "calendar" | "flag" | "people" };

const NODES: Node[] = [
  { x: 120, y: 120, r: 30, tone: "primary", glyph: "people" },
  { x: 262, y: 88, r: 20, tone: "mint" },
  { x: 400, y: 132, r: 26, tone: "dark", glyph: "calendar" },
  { x: 196, y: 238, r: 22, tone: "dark" },
  { x: 330, y: 250, r: 34, tone: "primary", glyph: "flag" },
  { x: 470, y: 268, r: 18, tone: "mint" },
  { x: 98, y: 330, r: 18, tone: "mint" },
  { x: 246, y: 372, r: 26, tone: "primary", glyph: "people" },
  { x: 418, y: 384, r: 22, tone: "dark" }
];

const LINKS: [number, number][] = [
  [0, 1], [1, 2], [0, 3], [3, 4], [2, 4], [4, 5], [3, 6], [3, 7], [4, 7], [7, 8], [5, 8]
];

function curve(a: Node, b: Node, bend: number) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const cx = mx - (b.y - a.y) * bend;
  const cy = my + (b.x - a.x) * bend;
  return `M${a.x},${a.y} Q${cx.toFixed(1)},${cy.toFixed(1)} ${b.x},${b.y}`;
}

const toneClass = {
  primary: "fill-primary",
  dark: "fill-brand-dark dark:fill-secondary",
  mint: "fill-mint"
} as const;

const glyphClass = {
  primary: "stroke-primary-foreground",
  dark: "stroke-brand-dark-foreground",
  mint: "stroke-brand-dark"
} as const;

function Glyph({ node }: { node: Node }) {
  if (!node.glyph) return null;
  const s = node.r * 0.42;
  const common = { fill: "none", strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className: glyphClass[node.tone] };
  switch (node.glyph) {
    case "calendar":
      return (
        <g {...common}>
          <rect x={node.x - s} y={node.y - s * 0.8} width={s * 2} height={s * 1.8} rx={3} />
          <path d={`M${node.x - s} ${node.y - s * 0.15}h${s * 2}M${node.x - s * 0.45} ${node.y - s * 1.1}v${s * 0.6}M${node.x + s * 0.45} ${node.y - s * 1.1}v${s * 0.6}`} />
        </g>
      );
    case "flag":
      return (
        <g {...common}>
          <path d={`M${node.x - s * 0.7} ${node.y + s}V${node.y - s}h${s * 1.4}l-${s * 0.35} ${s * 0.5} ${s * 0.35} ${s * 0.5}H${node.x - s * 0.7}`} />
        </g>
      );
    case "people":
      return (
        <g {...common}>
          <circle cx={node.x - s * 0.35} cy={node.y - s * 0.35} r={s * 0.38} />
          <circle cx={node.x + s * 0.5} cy={node.y - s * 0.2} r={s * 0.3} />
          <path d={`M${node.x - s} ${node.y + s * 0.85}a${s * 0.65} ${s * 0.65} 0 0 1 ${s * 1.3} 0M${node.x + s * 0.2} ${node.y + s * 0.85}a${s * 0.5} ${s * 0.5} 0 0 1 ${s * 0.9} 0`} />
        </g>
      );
  }
}

export function NetworkIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 560 460" className={className} aria-hidden="true" focusable="false">
      <defs>
        <mask id="trail-reveal" maskUnits="userSpaceOnUse" x="0" y="0" width="560" height="460">
          <rect width="560" height="460" fill="black" />
          {LINKS.map(([from, to], index) => (
            <path
              key={`m-${from}-${to}`}
              d={curve(NODES[from]!, NODES[to]!, index % 2 ? 0.14 : -0.14)}
              pathLength={1}
              fill="none"
              stroke="white"
              strokeWidth={14}
              strokeLinecap="round"
              className="trail-draw"
              style={{ animationDelay: `${450 + index * 80}ms` }}
            />
          ))}
        </mask>
      </defs>

      {/* Three soft regions, suggesting service units */}
      <path d="M40 150c0-70 60-110 140-104 70 6 110 50 100 110-10 64-70 98-140 92S40 214 40 150Z" className="fill-secondary" />
      <path d="M260 120c40-60 150-62 220-20 60 36 66 120 20 170-50 52-150 56-210 20-56-34-66-112-30-170Z" className="fill-secondary" opacity="0.75" />
      <path d="M60 320c20-50 100-70 180-56 90 16 210 30 230 90 18 56-60 92-170 92S40 410 60 320Z" className="fill-mint" opacity="0.45" />

      {/* Trails */}
      <g mask="url(#trail-reveal)" fill="none" strokeWidth={3} strokeLinecap="round" className="stroke-primary">
        {LINKS.map(([from, to], index) => (
          <path key={`t-${from}-${to}`} d={curve(NODES[from]!, NODES[to]!, index % 2 ? 0.14 : -0.14)} strokeDasharray="1 9" />
        ))}
      </g>

      {/* Badges */}
      {NODES.map((node, index) => (
        <g key={`n-${node.x}-${node.y}`} className="node-in" style={{ animationDelay: `${index * 45}ms` }}>
          <circle cx={node.x} cy={node.y} r={node.r + 5} className="fill-background" />
          <circle cx={node.x} cy={node.y} r={node.r} className={toneClass[node.tone]} />
          <circle
            cx={node.x}
            cy={node.y}
            r={node.r - 4.5}
            fill="none"
            strokeWidth={1.4}
            strokeDasharray="3 3"
            className={node.tone === "mint" ? "stroke-brand-dark/40" : "stroke-primary-foreground/60"}
          />
          <Glyph node={node} />
        </g>
      ))}
    </svg>
  );
}
