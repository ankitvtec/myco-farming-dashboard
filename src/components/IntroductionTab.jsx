import React, { useState } from "react";
import SitesMap from "./SitesMap.jsx";
import Gauge from "./Gauge.jsx";
import PropositionDiagram from "./PropositionDiagram.jsx";
import { STATUS_COLORS, TYPE_COLORS, fmt, fmtDate, computeAlerts } from "../lib/data.js";

const METRIC_ROWS = [
  ["Active Months", "active_months", "mo"],
  ["Area", "area_ha", "ha"],
  ["Baseline Concentration", "baseline_p_mgL", "mg/L P"],
  ["Depth", "depth_m", "m"],
  ["Dry Months", "dry_months", "mo"],
  ["Installed Flow Rate", "capacity_m3h", "m³/h"],
  ["Target Concentration", "target_p_mgL", "mg/L P"],
];

export default function IntroductionTab({ sites, site, stats, rows }) {
  const [gaugeIO, setGaugeIO] = useState("out");
  const [gaugeMode, setGaugeMode] = useState("realtime");
  const [gaugePeriod, setGaugePeriod] = useState("monthly");
  const [cycleView, setCycleView] = useState("overview");
  const alerts = computeAlerts(site, stats);

  // Filtration targets data
  const pBaseline = parseFloat(site.baseline_p_mgL) || 0;
  const pTarget = parseFloat(site.target_p_mgL) || 0;
  const pLatest = stats?.p_out_mgL?.latest ?? null;
  const nBaseline = parseFloat(site.baseline_n_mgL) || 0;
  const nTarget = parseFloat(site.target_n_mgL) || 0;
  const nLatest = stats?.n_out_mgL?.latest ?? null;

  const pProgress = pBaseline > pTarget && pLatest != null
    ? Math.min(100, Math.max(0, ((pBaseline - pLatest) / (pBaseline - pTarget)) * 100))
    : 0;
  const nProgress = nBaseline > nTarget && nLatest != null
    ? Math.min(100, Math.max(0, ((nBaseline - nLatest) / (nBaseline - nTarget)) * 100))
    : 0;

  const description = `The recommended solution in this case is a ${site.system_type} with a capacity of ${site.capacity_m3h} m³/h flow rate capacity and ${site.modules} Myco Islands for remediation of source water. The system is designed to operate in a closed-loop configuration, where the mycelium biomass is continuously monitored and replaced as needed to maintain optimal filtration performance.`;

  return (
    <div className="grid--intro">
      {/* LEFT HALF — Map + Targets / Description, then Table */}
      <div className="intro-col">
        <h3 className="section-title">Site Details</h3>
        <div className="map-desc-grid anim-fade-up">
          <div className="map-wrap">
            <SitesMap sites={sites} height="100%" dark highlightId={site.site_id} scrollZoom />
            <div className="map-legend-overlay">
              <div className="legend-group">
                <span className="legend-group__title">Installation Type</span>
                {Object.entries(TYPE_COLORS).map(([type, color]) => (
                  <span className="legend-row" key={type}>
                    <span className="legend-swatch" style={{ background: color }} />
                    {type}
                  </span>
                ))}
              </div>
              <div className="legend-group">
                <span className="legend-group__title">Status</span>
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                  <span className="legend-row" key={status}>
                    <span className="legend-dot" style={{ background: color }} />
                    {status}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="map-desc-side">
            <section className="card card--light">
              <h2 className="card__title">Filtration Targets</h2>
              <p className="card__subtitle">
                P: {Math.round(pProgress)}% · N: {Math.round(nProgress)}% complete
              </p>
              <div className="filtration-targets filtration-targets--light">
                <div className="filtration-targets__row">
                  <div className="filtration-targets__info">
                    <span className="filtration-targets__name">Phosphorus</span>
                    <span className="filtration-targets__range">{pBaseline.toFixed(2)} → {pTarget.toFixed(2)} mg/L</span>
                  </div>
                  <div className="filtration-targets__val">
                    <span className="filtration-targets__current">{pLatest != null ? pLatest.toFixed(3) : "—"} mg/L</span>
                    <div className="progress progress--compact">
                      <div className="progress__fill" style={{ width: `${pProgress}%` }} />
                    </div>
                  </div>
                </div>
                <div className="filtration-targets__row">
                  <div className="filtration-targets__info">
                    <span className="filtration-targets__name">Nitrogen</span>
                    <span className="filtration-targets__range">{nBaseline.toFixed(2)} → {nTarget.toFixed(2)} mg/L</span>
                  </div>
                  <div className="filtration-targets__val">
                    <span className="filtration-targets__current">{nLatest != null ? nLatest.toFixed(3) : "—"} mg/L</span>
                    <div className="progress progress--compact">
                      <div className="progress__fill" style={{ width: `${nProgress}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <p className="intro-description">{description}</p>
          </div>
        </div>

        <section className="card card--light anim-fade-up" style={{ animationDelay: ".1s" }}>
          <h2 className="card__title">Site Parameters</h2>
          <p className="card__subtitle">Deployment &amp; water-quality targets</p>
          <table className="metric-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th style={{ textAlign: "right" }}>Value</th>
                <th style={{ textAlign: "right" }}>Unit</th>
              </tr>
            </thead>
            <tbody>
              {METRIC_ROWS.map(([name, key, unit]) => {
                const decimals =
                  key === "area_ha" || key === "depth_m" ? 1
                  : key === "baseline_p_mgL" || key === "target_p_mgL" ? 2
                  : 0;
                return (
                  <tr key={key}>
                    <td className="metric-name">{name}</td>
                    <td className="metric-value">{fmt(site[key], decimals)}</td>
                    <td className="metric-unit">{unit}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>

      {/* RIGHT HALF — Diagram + Overview/Alerts, then Gauges */}
      <div className="intro-col">
        <h3 className="section-title">Sensing Proposition</h3>
        <div className="prop-alerts-grid anim-fade-up">
          <div className="prop-alerts-diagram">
            <PropositionDiagram modules={Number(site.modules) || 8} />
          </div>

          <div className="module-cycle module-cycle--inline">
            <div className="module-cycle__toggle">
              <button className={`module-cycle__btn ${cycleView === "overview" ? "is-active" : ""}`} onClick={() => setCycleView("overview")}>
                Overview
              </button>
              <button className={`module-cycle__btn ${cycleView === "alerts" ? "is-active" : ""}`} onClick={() => setCycleView("alerts")}>
                Alerts
                {alerts.length > 0 && <span className="module-cycle__badge">{alerts.length}</span>}
              </button>
            </div>

            {cycleView === "overview" ? (
              <div className="module-cycle__grid module-cycle__grid--stack">
                <div className="module-cycle__item">
                  <span className="module-cycle__label">Last Replaced</span>
                  <span className="module-cycle__value">{fmtDate(site.last_replaced)}</span>
                </div>
                <div className="module-cycle__item">
                  <span className="module-cycle__label">Next Replacement</span>
                  <span className="module-cycle__value module-cycle__value--amber">{fmtDate(site.next_replacement)}</span>
                  <span className="module-cycle__sub">Scheduled · {site.active_months}/{site.dry_months}/month</span>
                </div>
                <div className="module-cycle__item">
                  <span className="module-cycle__label">KG Deployed</span>
                  <span className="module-cycle__value">{fmt(site.kg_deployed)}</span>
                  <span className="module-cycle__sub">{site.modules} modules × 10 kg</span>
                </div>
              </div>
            ) : (
              <div className="module-cycle__alerts">
                {alerts.map((a, i) => (
                  <div className={`alert alert--${a.level}`} key={i}>
                    <span className="alert__dot" />
                    {a.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <section className="card panel--status anim-fade-up" style={{ animationDelay: ".12s" }}>
          <div className="gauges gauges--2x2">
            <Gauge metric="flow" stats={stats} rows={rows} io={gaugeIO} mode={gaugeMode} period={gaugePeriod} onIO={setGaugeIO} onMode={setGaugeMode} onPeriod={setGaugePeriod} />
            <Gauge metric="temp" stats={stats} rows={rows} io={gaugeIO} mode={gaugeMode} period={gaugePeriod} onIO={setGaugeIO} onMode={setGaugeMode} onPeriod={setGaugePeriod} />
            <Gauge metric="pressure" stats={stats} rows={rows} io={gaugeIO} mode={gaugeMode} period={gaugePeriod} onIO={setGaugeIO} onMode={setGaugeMode} onPeriod={setGaugePeriod} />
            <Gauge metric="humidity" stats={stats} rows={rows} io={gaugeIO} mode={gaugeMode} period={gaugePeriod} onIO={setGaugeIO} onMode={setGaugeMode} onPeriod={setGaugePeriod} />
          </div>
        </section>
      </div>
    </div>
  );
}
