import { useState } from 'react'
import TextInput from '../../../components/ui/TextInput'
import PerSchoolExportCodesTable from './PerSchoolExportCodesTable'
import { ENABLED_TOURS } from '../../../data/schoolRecords.schema'
import { useLanguage } from '../../../hooks/useLanguage'
import {
  PROGRAMME_SETUP_STORAGE_KEY,
  loadProgrammeSetup,
} from '../utils/programmeSetup'

export default function ProgrammeSetupCard({ onSaved, directoryVersion }) {
  const { t } = useLanguage()
  const [form, setForm] = useState(loadProgrammeSetup)
  const [isSaved, setIsSaved] = useState(false)

  // Global Settings and Session Duration are now VIEW ONLY — every field
  // below carries `disabled`, so these handlers never actually fire from
  // the UI anymore. Left in place (rather than removed) since nothing else
  // about this component's behavior is meant to change, and the disabled
  // inputs still need a value/onChange pair to render correctly as
  // controlled inputs.
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
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            {t('export.programmeSetup.title')}
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500">{t('export.programmeSetup.description')}</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-amber-500 px-5 py-2 text-sm font-semibold text-white
            transition-all duration-200 ease-out hover:bg-amber-600 hover:shadow-md hover:shadow-amber-500/30"
        >
          {t('export.programmeSetup.save')}
        </button>
      </div>

      {isSaved && (
        <p className="mt-3 animate-fade-in-up text-xs font-medium text-green-600">
          {t('export.programmeSetup.savedNote')}
        </p>
      )}

      <div className="mt-6">
        <p className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {t('export.programmeSetup.globalSettings')}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TextInput
            id="financialYear"
            label={t('export.programmeSetup.financialYear')}
            value={form.financialYear}
            onChange={handleChange('financialYear')}
            disabled
          />
          <TextInput
            id="partnerName"
            label={t('export.programmeSetup.partnerName')}
            value={form.partnerName}
            onChange={handleChange('partnerName')}
            disabled
          />
          <TextInput
            id="countryCode"
            label={t('export.programmeSetup.countryCode')}
            value={form.countryCode}
            onChange={handleChange('countryCode')}
            disabled
          />
          <TextInput
            id="deviceId"
            label={t('export.programmeSetup.deviceId')}
            value={form.deviceId}
            onChange={handleChange('deviceId')}
            disabled
          />
          <TextInput
            id="institutionType"
            label={t('export.programmeSetup.institutionType')}
            value={form.institutionType}
            onChange={handleChange('institutionType')}
            disabled
          />
          <TextInput
            id="underservedReach"
            label={t('export.programmeSetup.underservedReach')}
            value={form.underservedReach}
            onChange={handleChange('underservedReach')}
            disabled
          />
          <TextInput
            id="dataCollectionMethod"
            label={t('export.programmeSetup.dataCollectionMethod')}
            value={form.dataCollectionMethod}
            onChange={handleChange('dataCollectionMethod')}
            disabled
          />
          <TextInput
            id="language"
            label={t('export.programmeSetup.language')}
            value={form.language}
            onChange={handleChange('language')}
            disabled
          />
          <TextInput
            id="schoolType"
            label={t('export.programmeSetup.schoolType')}
            value={form.schoolType}
            onChange={handleChange('schoolType')}
            disabled
          />
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {t('export.programmeSetup.sessionDuration')}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {ENABLED_TOURS.map((tour) => (
            <TextInput
              key={tour.id}
              id={`duration-${tour.id}`}
              label={`${tour.name} ${t('export.programmeSetup.durationSuffix')}`}
              type="number"
              min="0"
              value={form.tourDurations[tour.id]}
              onChange={handleDurationChange(tour.id)}
              disabled
            />
          ))}
        </div>
      </div>

      <PerSchoolExportCodesTable directoryVersion={directoryVersion} />
    </section>
  )
}
