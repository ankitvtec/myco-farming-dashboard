// Remote data source configuration.
//
// The dashboard loads its CSVs from Google Drive when configured below, so
// updating a file in Drive is all that's needed — the next page load (or
// manual refresh) picks up the new data automatically.
//
// How to set up:
// 1. Upload each CSV to a Google Drive folder.
// 2. Right-click the file → Share → "Anyone with the link" (Viewer).
// 3. Copy the FILE ID from the share URL:
//      https://drive.google.com/file/d/<FILE_ID>/view
// 4. Paste the ID into REMOTE_FILES below.
//
// If REMOTE_FILES is empty (or a remote fetch fails), the dashboard falls
// back to the local CSVs in /public/data, so it always works.

export const REMOTE_FILES = {
  // sites: "PASTE_SITES_CSV_FILE_ID_HERE",
  // AA01: "PASTE_MONITORING_AA01_FILE_ID_HERE",
  // WB02: "PASTE_MONITORING_WB02_FILE_ID_HERE",
  // VN03: "PASTE_MONITORING_VN03_FILE_ID_HERE",
  // IN04: "PASTE_MONITORING_IN04_FILE_ID_HERE",
  // BR05: "PASTE_MONITORING_BR05_FILE_ID_HERE",
};

// Google Drive "export" endpoint serves the raw file for anyone-with-link files.
export function driveUrl(fileId) {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

// Resolve the fetch URL for a logical file key ("sites" or a site id).
// Returns null when no remote source is configured for that key.
export function remoteUrlFor(key) {
  const id = REMOTE_FILES[key];
  return id && id !== "PASTE_SITES_CSV_FILE_ID_HERE" ? driveUrl(id) : null;
}
