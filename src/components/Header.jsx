import React from "react";
import UserPanel from "./UserPanel.jsx";

const TABS = [
  { id: "intro", label: "Introduction" },
  { id: "impact", label: "Impact" },
];

export default function Header({ sites, currentSiteId, onSiteChange, tab, onTabChange, onRefresh, refreshing }) {
  return (
    <header className="app-header">
      <div className="brand">
        <img className="brand__logo-img" src={`${import.meta.env.BASE_URL}myco-logo.png`} alt="Myco Farming" />
        <div className="brand__meta">
          <span className="brand__sub">Mycelium Water Filtration · Fleet Monitor</span>
        </div>
      </div>

      <div className="header-controls">
        <select
          className="site-select__select"
          value={currentSiteId || ""}
          onChange={(e) => onSiteChange(e.target.value)}
          aria-label="Select site"
        >
          {sites.map((s) => (
            <option key={s.site_id} value={s.site_id}>
              {s.site_name} · {s.country}
            </option>
          ))}
        </select>

        <nav className="tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`tabs__btn ${tab === t.id ? "is-active" : ""}`}
              onClick={() => onTabChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <button
          type="button"
          className={`refresh-btn${refreshing ? " is-busy" : ""}`}
          onClick={onRefresh}
          disabled={refreshing}
          title="Re-fetch data from the remote source (Google Drive) or local CSVs"
        >
          <span className="refresh-btn__icon" aria-hidden="true">⟳</span>
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <UserPanel />
    </header>
  );
}
