import React from "react";
import { fmt, avgForPeriod } from "../lib/data.js";

function polar(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startDeg, endDeg) {
  const s = polar(cx, cy, r, startDeg);
  const e = polar(cx, cy, r, endDeg);
  const large = Math.abs(startDeg - endDeg) > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

const METRIC_META = {
  flow: { color: "#23C24E", unit: "m³/h", inKey: "flow_in_m3h", outKey: "flow_out_m3h" },
  temp: { color: "#F5A623", unit: "°C", inKey: "temp_in_c", outKey: "temp_out_c" },
  pressure: { color: "#23C24E", unit: "bar", inKey: "pressure_in_bar", outKey: "pressure_out_bar" },
  humidity: { color: "#7C5CFC", unit: "%", inKey: "humidity_in_pct", outKey: "humidity_out_pct" },
};

const PERIODS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

export default function Gauge({ metric, stats, rows, io, mode, period, onIO, onMode, onPeriod }) {
  const meta = METRIC_META[metric];
  const s = io === "in" ? stats[meta.inKey] : stats[meta.outKey];

  let value;
  if (mode === "realtime") {
    value = s?.latest;
  } else {
    value = rows?.length ? avgForPeriod(rows, io === "in" ? meta.inKey : meta.outKey, period) : s?.avg;
  }

  // padded range
  const min = s?.min ?? 0;
  const max = s?.max ?? 1;
  const span = max - min || 1;
  const lo = min - span * 0.15;
  const hi = max + span * 0.15;
  const frac = value === null || value === undefined || Number.isNaN(value)
    ? 0
    : Math.max(0, Math.min(1, (value - lo) / (hi - lo)));

  const cx = 60, cy = 62, r = 46;
  const startA = 180, endA = 0;
  const valA = startA - frac * (startA - endA);
  const needle = polar(cx, cy, r - 8, valA);

  return (
    <div className="gauge" data-metric={metric}>
      <div className="gauge__head">
        <span className="gauge__label">{metric}</span>
        <div className="io-toggle">
          <button className={`io ${io === "in" ? "is-active" : ""}`} onClick={() => onIO("in")}>IN</button>
          <button className={`io ${io === "out" ? "is-active" : ""}`} onClick={() => onIO("out")}>OUT</button>
        </div>
      </div>
      <svg className="gauge__svg" viewBox="0 0 120 70">
        <path d={describeArc(cx, cy, r, startA, endA)} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="8" strokeLinecap="round" />
        <path d={describeArc(cx, cy, r, startA, valA)} fill="none" stroke={meta.color} strokeWidth="8" strokeLinecap="round" style={{ transition: "all .6s cubic-bezier(.2,.7,.3,1)" }} />
        <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke="#fff" strokeWidth="2.5" strokeLinecap="round" style={{ transition: "all .6s cubic-bezier(.2,.7,.3,1)" }} />
        <circle cx={cx} cy={cy} r="4" fill="#fff" />
      </svg>
      <div className="gauge__value">
        {fmt(value, metric === "pressure" ? 2 : 1)} <span className="gauge__unit">{meta.unit}</span>
      </div>
      <div className="gauge__sub">
        {mode === "realtime" ? "latest" : `avg · ${PERIODS.find((p) => p.id === period)?.label.toLowerCase()}`} · {io === "in" ? "inlet" : "outlet"}
      </div>
      <div className="gauge__modes">
        <button className={`chip ${mode === "realtime" ? "is-active" : ""}`} onClick={() => onMode("realtime")}>Realtime</button>
        <button className={`chip ${mode === "average" ? "is-active" : ""}`} onClick={() => onMode("average")}>Average</button>
      </div>
      {mode === "average" && (
        <div className="gauge__periods">
          {PERIODS.map((p) => (
            <button key={p.id} className={`chip ${period === p.id ? "is-active" : ""}`} onClick={() => onPeriod(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
