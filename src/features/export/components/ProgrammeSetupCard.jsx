import { useState } from 'react'
import TextInput from '../../../components/ui/TextInput'
import PerSchoolExportCodesTable from './PerSchoolExportCodesTable'
import { TOURS } from '../../../data/schoolRecords.schema'
import {
  PROGRAMME_SETUP_STORAGE_KEY,
  loadProgrammeSetup,
} from '../utils/programmeSetup'

export default function ProgrammeSetupCard({ onSaved, directoryVersion }) {
  const [form, setForm] = useState(loadProgrammeSetup)
  const [isSaved, setIsSaved] = useState(false)

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
    setIsSaved(false)
  }

  const handleDurationChange = (tourId) => (event) => {
    setForm((prev) => ({
      ...prev,
      tourDurations: { ...prev.tourDurations, [tourId]: event.target.value },
    }))
    setIsSaved(false)
  }

  const handleSave = () => {
    localStorage.setItem(PROGRAMME_SETUP_STORAGE_KEY, JSON.stringify(form))
    setIsSaved(true)
    onSaved?.()
  }

  return (
    <section className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Programme Setup</h2>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
            Required fields for correct export format. Fill once, reuse every session.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-amber-500 px-5 py-2 text-sm font-semibold text-white
            transition-all duration-200 ease-out hover:bg-amber-600 hover:shadow-md hover:shadow-amber-500/30"
        >
          Save Setup
        </button>
      </div>

      {isSaved && (
        <p className="mt-3 animate-fade-in-up text-xs font-medium text-green-600">
          Saved for this session.
        </p>
      )}

      <div className="mt-6">
        <p className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Global Settings
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TextInput
            id="financialYear"
            label="Financial Year"
            value={form.financialYear}
            onChange={handleChange('financialYear')}
          />
          <TextInput
            id="partnerName"
            label="Partner Name"
            value={form.partnerName}
            onChange={handleChange('partnerName')}
          />
          <TextInput
            id="countryCode"
            label="Country Code"
            value={form.countryCode}
            onChange={handleChange('countryCode')}
          />
          <TextInput
            id="deviceId"
            label="Device ID"
            value={form.deviceId}
            onChange={handleChange('deviceId')}
          />
          <TextInput
            id="institutionType"
            label="Institution Type"
            value={form.institutionType}
            onChange={handleChange('institutionType')}
          />
          <TextInput
            id="underservedReach"
            label="Underserved Reach"
            value={form.underservedReach}
            onChange={handleChange('underservedReach')}
          />
          <TextInput
            id="dataCollectionMethod"
            label="Data Collection Method"
            value={form.dataCollectionMethod}
            onChange={handleChange('dataCollectionMethod')}
          />
          <TextInput
            id="language"
            label="Language"
            value={form.language}
            onChange={handleChange('language')}
          />
          <TextInput
            id="schoolType"
            label="School Type"
            value={form.schoolType}
            onChange={handleChange('schoolType')}
          />
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Session Duration per Tour (minutes)
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Object.values(TOURS).map((tour) => (
            <TextInput
              key={tour.id}
              id={`duration-${tour.id}`}
              label={`${tour.name} (min)`}
              type="number"
              min="0"
              value={form.tourDurations[tour.id]}
              onChange={handleDurationChange(tour.id)}
            />
          ))}
        </div>
      </div>

      <PerSchoolExportCodesTable directoryVersion={directoryVersion} />
    </section>
  )
}
