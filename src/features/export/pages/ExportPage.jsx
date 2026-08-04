import { useState } from 'react'
import SchoolManagementCard from '../components/SchoolManagementCard'
import ProgrammeSetupCard from '../components/ProgrammeSetupCard'
import ExportPreviewCard from '../components/ExportPreviewCard'
import DangerZoneCard from '../components/DangerZoneCard'
import { useLanguage } from '../../../hooks/useLanguage'

export default function ExportPage() {
  const { t } = useLanguage()
  const [directoryVersion, setDirectoryVersion] = useState(0)
  const bumpDirectoryVersion = () => setDirectoryVersion((version) => version + 1)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('export.title')}</h1>
      </div>

      <SchoolManagementCard directoryVersion={directoryVersion} onDirectoryChanged={bumpDirectoryVersion} />
      <ProgrammeSetupCard
        key={`setup-${directoryVersion}`}
        onSaved={bumpDirectoryVersion}
        directoryVersion={directoryVersion}
      />
      <ExportPreviewCard directoryVersion={directoryVersion} />
      <DangerZoneCard onDataCleared={bumpDirectoryVersion} />
    </div>
  )
}
