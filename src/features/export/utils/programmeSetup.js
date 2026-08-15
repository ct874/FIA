import { TOURS } from '../../../data/schoolRecords.schema'

export const PROGRAMME_SETUP_STORAGE_KEY = 'fia_programme_setup'

export const DEFAULT_PROGRAMME_SETUP = {
  financialYear: '2026-2027',
  partnerName: 'Foundation for Innovation and Action',
  countryCode: 'IN',
  deviceId: 'fia',
  institutionType: '1',
  underservedReach: 'Yes',
  dataCollectionMethod: 'classroom_aggregate',
  language: 'Hindi',
  schoolType: 'GOVERNMENT SCHOOL',
  tourDurations: {
    [TOURS.AWS.id]: 27,
    [TOURS.FC.id]: 48,
    [TOURS.AM.id]: 30,
  },
}

export function loadProgrammeSetup() {
  try {
    const raw = localStorage.getItem(PROGRAMME_SETUP_STORAGE_KEY)
    if (!raw) return DEFAULT_PROGRAMME_SETUP
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_PROGRAMME_SETUP,
      ...parsed,
      tourDurations: { ...DEFAULT_PROGRAMME_SETUP.tourDurations, ...parsed.tourDurations },
    }
  } catch {
    return DEFAULT_PROGRAMME_SETUP
  }
}
