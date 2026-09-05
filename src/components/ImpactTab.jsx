import React, { useState } from "react";
import ComplianceChart from "./ComplianceChart.jsx";
import { COST, fmt, waterTreatedForPeriod, pctProgress, toNum } from "../lib/data.js";

const PERIODS = ["daily", "weekly", "monthly", "annual"];

export default function ImpactTab({ site, stats, rows }) {
  const [waterPeriod, setWaterPeriod] = useState("monthly");
  const [nutrient, setNutrient] = useState("p");
  const [costIO, setCostIO] = useState("n");

  const water = waterTreatedForPeriod(rows, waterPeriod);
  const nRemoved = stats.n_removed_kg_cum?.latest || 0;
  const pRemoved = stats.p_removed_kg_cum?.latest || 0;
  const kwh = stats.electricity_kwh_cum?.latest || 0;
  const waterTotal = stats.water_treated_m3_cum?.latest || 0;
  const totalCost = kwh * COST.elecPriceEurPerKwh;
  const removed = costIO === "n" ? nRemoved : pRemoved;
  const costPerKg = removed > 0 ? totalCost / removed : 0;
  const costPerM3 = waterTotal > 0 ? totalCost / waterTotal : 0;

  const pOut = stats.p_out_mgL?.latest;
  const nOut = stats.n_out_mgL?.latest;
  const pProg = pctProgress(site.baseline_p_mgL, site.target_p_mgL, pOut);
  const nProg = pctProgress(site.baseline_n_mgL, site.target_n_mgL, nOut);

  const score = toNum(site.ekr_score);
  const target = toNum(site.ekr_target);
  const diff = (score ?? 0) - (target ?? 0);
  const badge = diff >= 0.08 ? ["On target", "green"] : diff >= -0.08 ? ["Near target", "amber"] : ["Below target", "red"];
  const maxScale = Math.max(target || 0, score || 0) * 1.4 || 1;

  const compTarget = nutrient === "n" ? site.target_n_mgL : site.target_p_mgL;

  return (
    <div className="grid--impact">
      {/* LEFT COLUMN */}
      <div className="impact-col">
        <section className="card anim-fade-up">
          <h2 className="card__title">Water Treated</h2>
          <p className="card__subtitle">Rolling window from latest reading</p>
          <div className="kpi kpi--green" style={{ border: "none", padding: "18px" }}>
            <div className="kpi__label">Volume</div>
            <div className="kpi__value">
              {fmt(water, 0)} <span className="kpi__unit">m³ treated {waterPeriod}</span>
            </div>
          </div>
          <div className="segmented" style={{ marginTop: 16 }}>
            {PERIODS.map((p) => (
              <button key={p} className={`segmented__btn ${waterPeriod === p ? "is-active" : ""}`} onClick={() => setWaterPeriod(p)}>
                {p[0].toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </section>

        <section className="card anim-fade-up" style={{ animationDelay: ".08s" }}>
          <h2 className="card__title">Nutrients Removed</h2>
          <p className="card__subtitle">Cumulative mass captured by mycelium</p>
          <div className="impact-row">
            <div className="kpi kpi--violet">
              <div className="kpi__label">Nitrogen (N)</div>
              <div className="kpi__value">{fmt(nRemoved, 0)} <span className="kpi__unit">kg</span></div>
            </div>
            <div className="kpi kpi--violet">
              <div className="kpi__label">Phosphorus (P)</div>
              <div className="kpi__value">{fmt(pRemoved, 2)} <span className="kpi__unit">kg</span></div>
            </div>
          </div>
        </section>

        <section className="card anim-fade-up" style={{ animationDelay: ".16s" }}>
          <h2 className="card__title">Concentration Targets</h2>
          <p className="card__subtitle">Progress from baseline to target</p>

          <div className="progress">
            <div className="progress__head">
              <span className="progress__label">Phosphorus — {site.baseline_p_mgL} → {site.target_p_mgL} mg/L</span>
              <span className="progress__pct">{Math.round(pProg)}%</span>
            </div>
            <div className="progress__track">
              <div className="progress__fill" style={{ width: `${Math.max(0, Math.min(100, pProg))}%` }} />
            </div>
            <div className="progress__head" style={{ marginTop: 6 }}>
              <span className="progress__label" style={{ color: "var(--ink-500)" }}>Current {fmt(pOut, 3)} mg/L</span>
            </div>
          </div>

          <div className="progress">
            <div className="progress__head">
              <span className="progress__label">Nitrogen — {site.baseline_n_mgL} → {site.target_n_mgL} mg/L</span>
              <span className="progress__pct">{Math.round(nProg)}%</span>
            </div>
            <div className="progress__track">
              <div className="progress__fill progress__fill--violet" style={{ width: `${Math.max(0, Math.min(100, nProg))}%` }} />
            </div>
            <div className="progress__head" style={{ marginTop: 6 }}>
              <span className="progress__label" style={{ color: "var(--ink-500)" }}>Current {fmt(nOut, 2)} mg/L</span>
            </div>
          </div>
        </section>

        <section className="card ekr anim-fade-up" style={{ animationDelay: ".24s" }}>
          <h2 className="card__title">Ecosystem KPI (EKR)</h2>
          <p className="card__subtitle">Restoration score vs. target</p>
          <div className="ekr__value">{fmt(score, 2)}</div>
          <span className={`ekr__badge ekr__badge--${badge[1]}`}>● {badge[0]}</span>
          <div className="ekr__track">
            <div className="ekr__fill" style={{ width: `${Math.min(100, ((score || 0) / maxScale) * 100)}%` }} />
            <div className="ekr__mark" style={{ left: `${((target || 0) / maxScale) * 100}%` }} />
          </div>
          <div className="ekr__scale">
            <span>0</span>
            <span>Target {fmt(target, 2)}</span>
            <span>{fmt(maxScale, 1)}</span>
          </div>
        </section>
      </div>

      {/* RIGHT COLUMN */}
      <div className="impact-col">
        <section className="card anim-fade-up" style={{ animationDelay: ".08s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 className="card__title">Compliance Trajectory</h2>
              <p className="card__subtitle">Monthly outlet concentration vs. target &amp; projection</p>
            </div>
            <div className="segmented">
              <button className={`segmented__btn ${nutrient === "p" ? "is-active" : ""}`} onClick={() => setNutrient("p")}>P</button>
              <button className={`segmented__btn ${nutrient === "n" ? "is-active" : ""}`} onClick={() => setNutrient("n")}>N</button>
            </div>
          </div>
          <ComplianceChart rows={rows} nutrient={nutrient} target={compTarget} />
        </section>

        <section className="card anim-fade-up" style={{ animationDelay: ".16s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 className="card__title">Operating Cost</h2>
              <p className="card__subtitle">Energy-driven filtration economics</p>
            </div>
            <div className="segmented">
              <button className={`segmented__btn ${costIO === "n" ? "is-active" : ""}`} onClick={() => setCostIO("n")}>per kg N</button>
              <button className={`segmented__btn ${costIO === "p" ? "is-active" : ""}`} onClick={() => setCostIO("p")}>per kg P</button>
            </div>
          </div>
          <div className="impact-row">
            <div className="kpi kpi--amber">
              <div className="kpi__label">Cost / kg {costIO.toUpperCase()}</div>
              <div className="kpi__value">€{fmt(costPerKg, 2)}</div>
            </div>
            <div className="kpi kpi--amber">
              <div className="kpi__label">Cost / m³</div>
              <div className="kpi__value">€{fmt(costPerM3, 3)}</div>
            </div>
            <div className="kpi">
              <div className="kpi__label">Electricity</div>
              <div className="kpi__value">{fmt(kwh, 0)} <span className="kpi__unit">kWh</span></div>
            </div>
            <div className="kpi">
              <div className="kpi__label">CO₂ Emitted</div>
              <div className="kpi__value">{fmt(stats.co2_kg_cum.latest || 0, 0)} <span className="kpi__unit">kg</span></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
