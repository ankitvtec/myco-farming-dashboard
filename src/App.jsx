import React, { useEffect, useState, useCallback } from "react";
import Header from "./components/Header.jsx";
import IntroductionTab from "./components/IntroductionTab.jsx";
import ImpactTab from "./components/ImpactTab.jsx";
import { fetchCSVRemote, computeStats, withHumidity } from "./lib/data.js";

export default function App() {
  const [sites, setSites] = useState([]);
  const [currentSiteId, setCurrentSiteId] = useState(null);
  const [monitoring, setMonitoring] = useState([]);
  const [stats, setStats] = useState({});
  const [tab, setTab] = useState("intro");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const operationalSites = sites.filter((s) => s.status === "Operational");
  const site = sites.find((s) => s.site_id === currentSiteId) || null;
  const ready = Boolean(site) && monitoring.length > 0;

  const selectSite = useCallback(async (id) => {
    setCurrentSiteId(id);
    try {
      const { headers, data } = await fetchCSVRemote(id, `${import.meta.env.BASE_URL}data/monitoring_${id}.csv`);
      const rows = withHumidity(
        data.map((row) => {
          const o = {};
          headers.forEach((h, i) => (o[h] = row[i]));
          return o;
        })
      );
      setMonitoring(rows);
      setStats(computeStats(rows));
    } catch (e) {
      console.error(e);
      setMonitoring([]);
      setStats({});
    }
  }, []);

  const loadSites = useCallback(async () => {
    const { headers, data } = await fetchCSVRemote("sites", `${import.meta.env.BASE_URL}data/sites.csv`);
    return data.map((row) => {
      const o = {};
      headers.forEach((h, i) => (o[h] = row[i]));
      return o;
    });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const all = await loadSites();
        setSites(all);
        const first = all.find((s) => s.status === "Operational");
        if (first) await selectSite(first.site_id);
      } catch (e) {
        console.error(e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadSites, selectSite]);

  // Manual refresh: re-pull sites + current site monitoring from the remote
  // source (Google Drive) when configured, otherwise from local CSVs.
  const [refreshing, setRefreshing] = useState(false);
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const all = await loadSites();
      setSites(all);
      if (currentSiteId) await selectSite(currentSiteId);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }, [loadSites, selectSite, currentSiteId]);

  return (
    <>
      <Header
        sites={operationalSites}
        currentSiteId={currentSiteId}
        onSiteChange={selectSite}
        tab={tab}
        onTabChange={setTab}
        onRefresh={refresh}
        refreshing={refreshing}
      />

      <main className="app-main">
        <section className={`tab-panel${tab === "intro" ? " is-active" : ""}`}>
          {ready && <IntroductionTab sites={sites} site={site} stats={stats} rows={monitoring} />}
        </section>
        <section className={`tab-panel${tab === "impact" ? " is-active" : ""}`}>
          {ready && <ImpactTab site={site} stats={stats} rows={monitoring} />}
        </section>
      </main>

      <footer className="app-footer">
        {site ? (
          <>
            Data: {site.site_name} · {monitoring.length.toLocaleString()} readings · Myco Farming
            Water Filtration
          </>
        ) : (
          "Myco Farming Water Filtration"
        )}
      </footer>

      {loading && (
        <div className="overlay">
          <div className="spinner" />
          <div className="overlay__text">Loading Myco Farming dashboard…</div>
        </div>
      )}
      {error && !loading && (
        <div className="overlay">
          <div className="overlay__text">Failed to load data: {error}</div>
        </div>
      )}
    </>
  );
}
