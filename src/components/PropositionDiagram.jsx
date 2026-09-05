import React from "react";

// Deterministic pseudo-random in [0,1)
function rand(seed, i) {
  const x = Math.sin(seed * 127.1 + i * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// White mycelium root branches inside a module (relative to center x, top y)
function myceliumPaths(cx, topY, h, seed) {
  const paths = [];
  const trunkTop = topY + 10;
  const trunkBottom = topY + h * 0.5;
  paths.push(`M ${cx} ${trunkTop} L ${cx} ${trunkBottom}`);
  const nBranches = 4;
  for (let b = 0; b < nBranches; b++) {
    const by = trunkTop + (trunkBottom - trunkTop) * (0.15 + 0.2 * b) + rand(seed, b) * 6;
    const dir = b % 2 === 0 ? -1 : 1;
    const bx = cx + dir * (5 + rand(seed, b + 10) * 9);
    const byEnd = by + 12 + rand(seed, b + 20) * 14;
    paths.push(`M ${cx} ${by} L ${bx} ${byEnd}`);
    const sx = bx + dir * (3 + rand(seed, b + 30) * 5);
    const sy = byEnd + 7 + rand(seed, b + 40) * 9;
    paths.push(`M ${bx} ${byEnd} L ${sx} ${sy}`);
  }
  return paths;
}

// Scattered white dots inside a module
function myceliumDots(cx, topY, h, seed) {
  const dots = [];
  for (let d = 0; d < 12; d++) {
    dots.push({
      dx: cx + (rand(seed + 7, d) - 0.5) * 26,
      dy: topY + 12 + rand(seed + 13, d + 50) * (h - 24),
      r: 0.5 + rand(seed + 3, d + 90) * 0.9,
    });
  }
  return dots;
}

// Numbered callout badge
function Badge({ x, y, n, fill }) {
  return (
    <g>
      <circle cx={x} cy={y} r="9" fill={fill} stroke="#fff" strokeWidth="1.5" />
      <text x={x} y={y + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">
        {n}
      </text>
    </g>
  );
}

// Diagram matching the saved reference image: top distribution pipe, 8 mycelium
// capsule modules in a dashed border, numbered callouts, IN/OUT arrows, reservoir
export default function PropositionDiagram({ modules = 8, label = "Mycelium Biomass Modules" }) {
  const n = Math.max(1, Math.min(12, modules));

  const W = 640;
  const H = 632;
  const mw = 46;
  const gap = 15;
  const totalW = n * mw + (n - 1) * gap;
  const startX = (W - totalW) / 2;

  const pipeY = 54;
  const modY = 108;
  const modH = 352;
  const resY = modY + modH + 72;
  const resH = 62;
  const resX = 70;
  const resW = W - 140;

  const modulesX = Array.from({ length: n }, (_, i) => startX + i * (mw + gap));
  const centers = modulesX.map((x) => x + mw / 2);
  const inY = modY + modH / 2;
  const outY = resY + resH / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} style={{ width: "100%", height: "100%", display: "block" }} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="modGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E3EEF1" />
          <stop offset="55%" stopColor="#C4DAE0" />
          <stop offset="100%" stopColor="#A9C6CE" />
        </linearGradient>
        <linearGradient id="resGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0A4A57" />
          <stop offset="100%" stopColor="#012A33" />
        </linearGradient>
        <marker id="arrowDark" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#012A33" />
        </marker>
        <marker id="arrowPipe" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#012A33" />
        </marker>
      </defs>

      {/* top distribution pipe */}
      <line x1={centers[0]} y1={pipeY} x2={centers[n - 1]} y2={pipeY} stroke="#012A33" strokeWidth="2" />
      {centers.map((cx, i) => (
        <line key={i} x1={cx} y1={pipeY} x2={cx} y2={modY - 2} stroke="#012A33" strokeWidth="1.6" markerEnd="url(#arrowPipe)" />
      ))}

      {/* dashed border around modules */}
      <rect
        x={startX - 20} y={pipeY + 18}
        width={totalW + 40} height={modY + modH + 14 - (pipeY + 18)}
        rx="8" fill="none" stroke="#B7C6CC" strokeWidth="1.5" strokeDasharray="6 5"
      />

      {/* modules (capsule) with mycelium */}
      {modulesX.map((x, i) => {
        const cx = x + mw / 2;
        return (
          <g key={i}>
            <rect x={x} y={modY} width={mw} height={modH} rx={mw / 2} fill="url(#modGrad)" stroke="#7FA3AD" strokeWidth="1.2" />
            {myceliumPaths(cx, modY, modH, i + 1).map((d, k) => (
              <path key={k} d={d} fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.55" strokeLinecap="round" />
            ))}
            {myceliumDots(cx, modY, modH, i + 1).map((dot, k) => (
              <circle key={k} cx={dot.dx} cy={dot.dy} r={dot.r} fill="#fff" opacity="0.5" />
            ))}
          </g>
        );
      })}

      {/* down arrows from module bottoms into reservoir */}
      {centers.map((cx, i) => (
        <line key={i} x1={cx} y1={modY + modH + 4} x2={cx} y2={resY - 4} stroke="#012A33" strokeWidth="1.6" markerEnd="url(#arrowPipe)" />
      ))}

      {/* IN label + arrow (left) */}
      <text x="16" y={inY - 14} fontSize="14" fontWeight="700" fill="#012A33">IN</text>
      <line x1="34" y1={inY} x2={startX - 24} y2={inY} stroke="#012A33" strokeWidth="2.5" markerEnd="url(#arrowDark)" />

      {/* OUT label + arrow (right) */}
      <text x={W - 44} y={outY - 14} fontSize="14" fontWeight="700" fill="#012A33">OUT</text>
      <line x1={W - 70} y1={outY} x2={W - 30} y2={outY} stroke="#012A33" strokeWidth="2.5" markerEnd="url(#arrowDark)" />

      {/* reservoir */}
      <rect x={resX} y={resY} width={resW} height={resH} rx="10" fill="url(#resGrad)" stroke="rgba(255,255,255,.18)" strokeWidth="1" />
      <text x={W / 2} y={resY + resH / 2 + 5} textAnchor="middle" fontSize="15" fontWeight="600" fill="#EAF5F7">water reservoir</text>

      {/* numbered callouts */}
      <Badge x={20} y={inY + 2} n="1" fill="#E08A1E" />
      <Badge x={centers[Math.floor(n / 2)]} y={pipeY} n="2" fill="#012A33" />
      <Badge x={centers[Math.min(4, n - 1)]} y={modY + 30} n="3" fill="#23C24E" />
      <Badge x={resX - 18} y={outY} n="4" fill="#012A33" />
      <Badge x={W - 20} y={outY + 2} n="5" fill="#23C24E" />
    </svg>
  );
}
