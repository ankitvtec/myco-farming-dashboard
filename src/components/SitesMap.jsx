import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import { STATUS_COLORS } from "../lib/data.js";

const OSM_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const SAT_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const SAT_ATTR = "Imagery &copy; Esri, Maxar, Earthstar Geographics";

function FitAll({ sites }) {
  const map = useMap();
  useEffect(() => {
    if (!sites.length) return;
    const bounds = L.latLngBounds(sites.map((s) => [Number(s.latitude), Number(s.longitude)]));
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [map, sites]);
  return null;
}

export default function SitesMap({ sites, height = 300, dark = false, highlightId = null, scrollZoom = false }) {
  const wrapRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [satellite, setSatellite] = useState(false);

  // Only mount the Leaflet map once the wrapper has a real size.
  // Maps mounted inside display:none containers initialize at 0x0 and
  // never load tiles; waiting for visibility avoids that entirely.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const check = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setVisible(true);
    };
    check();
    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(check);
      ro.observe(el);
    }
    const t = setTimeout(check, 300);
    return () => {
      clearTimeout(t);
      if (ro) ro.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className={dark ? "status-map" : "fleet-map"} style={{ height }}>
      {visible && (
        <MapContainer
          center={[20, 10]}
          zoom={2}
          minZoom={2}
          maxZoom={19}
          scrollWheelZoom={scrollZoom}
          style={{ height: "100%", width: "100%" }}
        >
          {satellite ? (
            <TileLayer url={SAT_URL} attribution={SAT_ATTR} />
          ) : (
            <TileLayer url={OSM_URL} subdomains="abc" attribution={OSM_ATTR} />
          )}
          <FitAll sites={sites} />
          {sites.map((s) => {
            const color = STATUS_COLORS[s.status] || "#B4C6CC";
            const isHi = highlightId && s.site_id === highlightId;
            return (
              <CircleMarker
                key={s.site_id}
                center={[Number(s.latitude), Number(s.longitude)]}
                radius={isHi ? 12 : 9}
                pathOptions={{
                  color: "#ffffff",
                  weight: isHi ? 3 : 2,
                  fillColor: color,
                  fillOpacity: 0.95,
                }}
              >
                <Tooltip direction="top" offset={[0, -6]}>
                  <strong>{s.site_name}</strong>
                  <br />
                  {s.country} · {s.system_type}
                  <br />
                  {s.status}
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
      )}
      <button
        type="button"
        className="map-view-toggle"
        onClick={() => setSatellite((v) => !v)}
        title={satellite ? "Switch to map view" : "Switch to satellite view"}
      >
        {satellite ? "Map" : "Satellite"}
      </button>
    </div>
  );
}
