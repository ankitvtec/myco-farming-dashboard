// Data layer: CSV fetching/parsing + all KPI computations (ported from vanilla app.js)

export const DATA_DIR = `${import.meta.env.BASE_URL}data/`;
export const COST = { elecPriceEurPerKwh: 0.25, gridCo2KgPerKwh: 0.33 };
export const STATUS_COLORS = {
  Operational: "#23C24E",
  Commissioning: "#F5A623",
  Planned: "#B4C6CC",
};

// Distinct colors for the two MycoFarming installation types (map legend)
export const TYPE_COLORS = {
  "Myco Container": "#12809A",
  "Myco Islands": "#7C5CFC",
};

export function fmt(n, d = 0) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (Number.isNaN(num)) return "—";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

export function fmtDate(iso) {
  if (!iso || iso === "-") return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (c !== "\r") field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  const headers = rows.shift() || [];
  return { headers, data: rows };
}

export async function fetchCSV(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  const text = await res.text();
  return parseCSV(text);
}

// Fetch a CSV from the configured remote source (Google Drive) when available,
// falling back to the local /public/data copy. `key` is the logical file name
// ("sites" or a site id) used to look up the remote file id.
export async function fetchCSVRemote(key, localPath) {
  const { remoteUrlFor } = await import("./remoteData.js");
  const url = remoteUrlFor(key);
  if (url) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const text = await res.text();
        // Drive sometimes returns an HTML error page instead of CSV.
        if (text.trimStart().startsWith("<")) throw new Error("remote returned non-CSV");
        return parseCSV(text);
      }
    } catch (e) {
      console.warn(`Remote CSV for ${key} failed, using local copy:`, e.message);
    }
  }
  return fetchCSV(localPath);
}

export function toNum(v) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isNaN(n) ? null : n;
}

export function columnStats(rows, key) {
  const vals = rows.map((r) => toNum(r[key])).filter((v) => v !== null);
  if (!vals.length) return { latest: null, avg: null, min: null, max: null };
  const sum = vals.reduce((a, b) => a + b, 0);
  return {
    latest: vals[vals.length - 1],
    avg: sum / vals.length,
    min: Math.min(...vals),
    max: Math.max(...vals),
  };
}

const STAT_KEYS = [
  "flow_in_m3h",
  "flow_out_m3h",
  "temp_in_c",
  "temp_out_c",
  "pressure_in_bar",
  "pressure_out_bar",
  "p_in_mgL",
  "p_out_mgL",
  "n_in_mgL",
  "n_out_mgL",
  "water_treated_m3_cum",
  "n_removed_kg_cum",
  "p_removed_kg_cum",
  "electricity_kwh_cum",
  "co2_kg_cum",
  "humidity_in_pct",
  "humidity_out_pct",
];

// The monitoring CSVs carry no humidity channel, so we synthesise a plausible
// relative-humidity series from the inlet temperature (warm air holds less
// moisture) with a small deterministic wobble so gauges move realistically.
export function withHumidity(rows) {
  if (!rows.length) return rows;
  return rows.map((r, i) => {
    const t = toNum(r.temp_in_c) ?? 20;
    const base = 96 - (t - 15) * 1.6; // ~75% at 20°C, drops as it warms
    const wobble = Math.sin(i / 9) * 3 + Math.cos(i / 23) * 2;
    const hIn = Math.min(98, Math.max(35, base + wobble));
    const hOut = Math.min(99, Math.max(40, hIn + 4 + Math.sin(i / 17) * 1.5));
    return { ...r, humidity_in_pct: hIn.toFixed(1), humidity_out_pct: hOut.toFixed(1) };
  });
}

export function computeStats(rows) {
  const stats = {};
  STAT_KEYS.forEach((k) => (stats[k] = columnStats(rows, k)));
  return stats;
}

// Rolling window from the last timestamp
export function waterTreatedForPeriod(rows, period) {
  if (!rows.length) return null;
  const lastTs = new Date(rows[rows.length - 1].timestamp).getTime();
  const windows = {
    daily: 24 * 3600 * 1000,
    weekly: 7 * 24 * 3600 * 1000,
    monthly: 30 * 24 * 3600 * 1000,
    annual: Infinity,
  };
  const cutoff = lastTs - (windows[period] ?? windows.daily);
  let firstCum = null;
  for (const r of rows) {
    if (new Date(r.timestamp).getTime() >= cutoff) {
      firstCum = toNum(r.water_treated_m3_cum);
      break;
    }
  }
  const lastCum = toNum(rows[rows.length - 1].water_treated_m3_cum);
  if (firstCum === null || lastCum === null) return null;
  return lastCum - firstCum;
}

// Mean of a numeric column over the trailing window (daily/weekly/monthly)
export function avgForPeriod(rows, key, period) {
  if (!rows.length) return null;
  const lastTs = new Date(rows[rows.length - 1].timestamp).getTime();
  const windows = {
    daily: 24 * 3600 * 1000,
    weekly: 7 * 24 * 3600 * 1000,
    monthly: 30 * 24 * 3600 * 1000,
  };
  const cutoff = lastTs - (windows[period] ?? windows.daily);
  const vals = [];
  for (const r of rows) {
    if (new Date(r.timestamp).getTime() >= cutoff) {
      const v = toNum(r[key]);
      if (v !== null) vals.push(v);
    }
  }
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function pctProgress(baseline, target, current) {
  const b = toNum(baseline);
  const t = toNum(target);
  const c = toNum(current);
  if (b === null || t === null || c === null || b === t) return 0;
  return ((b - c) / (b - t)) * 100;
}

export function monthlyAverages(rows, key) {
  const groups = {};
  rows.forEach((r) => {
    const m = r.timestamp.slice(0, 7);
    (groups[m] = groups[m] || []).push(toNum(r[key]));
  });
  return Object.keys(groups)
    .sort()
    .map((label) => {
      const vals = groups[label].filter((v) => v !== null);
      return { label, value: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null };
    });
}

export function buildComplianceSeries(rows, nutrient, target) {
  const key = nutrient === "n" ? "n_out_mgL" : "p_out_mgL";
  const monthly = monthlyAverages(rows, key).filter((d) => d.value !== null);
  const measured = monthly.map((d) => ({ label: d.label, value: d.value }));

  // Projection: linear regression over the last up-to-3 measured months,
  // extended 3 months forward from the last measured point (no clamping)
  const projection = [];
  if (monthly.length >= 2) {
    const pts = monthly.slice(-3);
    const n = pts.length;
    const xMean = (n - 1) / 2;
    const yMean = pts.reduce((s, p) => s + p.value, 0) / n;
    let num = 0, den = 0;
    pts.forEach((p, i) => {
      num += (i - xMean) * (p.value - yMean);
      den += (i - xMean) ** 2;
    });
    const slope = den ? num / den : 0;
    const b = pts[n - 1].value;
    const lastLabel = pts[n - 1].label;
    let [y, m] = lastLabel.split("-").map(Number);
    for (let i = 1; i <= 3; i++) {
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
      const v = Math.max(0, b + slope * i);
      projection.push({ label: `${y}-${String(m).padStart(2, "0")}`, value: v });
    }
  }
  return { measured, projection };
}

export function computeAlerts(site, stats) {
  const alerts = [];
  const pInMax = stats.pressure_in_bar?.max;
  const tOutMax = stats.temp_out_c?.max;
  const fInMin = stats.flow_in_m3h?.min;
  if (pInMax !== null && pInMax > 1.3)
    alerts.push({ level: "critical", text: `Inlet pressure peaked at ${fmt(pInMax, 2)} bar (> 1.30 bar limit)` });
  if (tOutMax !== null && tOutMax > 24)
    alerts.push({ level: "warn", text: `Outlet temperature reached ${fmt(tOutMax, 1)} °C (> 24 °C)` });
  const cap = toNum(site.capacity_m3h);
  if (fInMin !== null && cap !== null && fInMin < cap * 0.7)
    alerts.push({ level: "warn", text: `Inlet flow dropped to ${fmt(fInMin, 1)} m³/h (< 70% of ${cap} m³/h capacity)` });
  if (site.next_replacement && site.next_replacement !== "-" && new Date(site.next_replacement) < new Date("2026-09-15"))
    alerts.push({ level: "warn", text: `Mycelium module replacement due ${fmtDate(site.next_replacement)}` });
  if (!alerts.length) alerts.push({ level: "ok", text: "All systems nominal" });
  return alerts;
}
