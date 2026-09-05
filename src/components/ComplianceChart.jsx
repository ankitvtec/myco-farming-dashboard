import React, { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from "recharts";
import { buildComplianceSeries, fmt, toNum } from "../lib/data.js";

export default function ComplianceChart({ rows, nutrient, target }) {
  const t = toNum(target);
  const { measured, projection } = useMemo(
    () => buildComplianceSeries(rows, nutrient, target),
    [rows, nutrient, target]
  );

  // Merge measured + projection on a shared label axis
  const data = useMemo(() => {
    const map = {};
    measured.forEach((d) => (map[d.label] = { label: d.label, Measured: d.value }));
    projection.forEach((d) => {
      map[d.label] = map[d.label] || { label: d.label };
      map[d.label].Projection = d.value;
    });
    // Anchor the projection to the last measured point so the lines connect
    if (measured.length && projection.length) {
      const last = measured[measured.length - 1];
      map[last.label] = map[last.label] || { label: last.label };
      map[last.label].Projection = last.value;
    }
    Object.keys(map).forEach((k) => (map[k].Target = t));
    return Object.values(map);
  }, [measured, projection, t]);

  const lastMeasured = measured.length ? measured[measured.length - 1].value : null;
  const firstMeasured = measured.length ? measured[0].value : null;
  const trend =
    lastMeasured !== null && firstMeasured !== null
      ? lastMeasured < firstMeasured ? "Declining" : "Rising"
      : "—";

  return (
    <div>
      <div className="compliance">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EAF1F2" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#8298A0" }} />
            <YAxis tick={{ fontSize: 11, fill: "#8298A0" }} unit=" mg/L" width={70} />
            <Tooltip
              formatter={(v, name) => [`${fmt(v, 2)} mg/L`, name]}
              contentStyle={{ borderRadius: 10, border: "1px solid #EAF1F2", fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {t !== null && (
              <ReferenceLine y={t} stroke="#6D4AE0" strokeDasharray="4 4" label={{ value: "Target", position: "right", fill: "#6D4AE0", fontSize: 11 }} />
            )}
            <Line type="monotone" dataKey="Measured" stroke="#12809A" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="Projection" stroke="#7C5CFC" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Target" stroke="#B4C6CC" strokeWidth={1.5} dot={false} legendType="none" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="comp-stats">
        <div>
          <div className="cstat__k">Latest (monthly avg)</div>
          <div className="cstat__v">{fmt(lastMeasured, 2)} mg/L</div>
        </div>
        <div>
          <div className="cstat__k">Target</div>
          <div className="cstat__v">{fmt(t, 2)} mg/L</div>
        </div>
        <div>
          <div className="cstat__k">Trend</div>
          <div className={`cstat__v ${trend === "Declining" ? "trend-down" : ""}`}>{trend}</div>
        </div>
      </div>
    </div>
  );
}
