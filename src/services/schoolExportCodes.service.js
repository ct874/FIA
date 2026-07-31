const STORAGE_KEY = 'fia_school_export_codes'

// Per-school District Code / Postal Code overrides needed for the official
// export formats (keyed by UDISE). No backend yet, so localStorage is the
// store — same pattern as schoolDirectory.service.js.
export function getSchoolExportCodes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveSchoolExportCodes(codes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(codes))
}
