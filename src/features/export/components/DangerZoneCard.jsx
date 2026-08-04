import { useState } from 'react'
import { saveSchoolExportCodes } from '../../../services/schoolExportCodes.service'
import { deleteAllSchoolsRequest, deleteAllProgramDataRequest } from '../../../api/schools.api'
import { PROGRAMME_SETUP_STORAGE_KEY } from '../utils/programmeSetup'
import { getApiErrorMessage } from '../../../utils/apiErrorMessage'
import { useLanguage } from '../../../hooks/useLanguage'

const DANGER_BUTTON =
  'inline-flex items-center justify-center rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-all duration-200 ease-out hover:border-red-600 hover:bg-red-600 hover:text-white hover:shadow-md hover:shadow-red-600/20'
const DANGER_BUTTON_SOLID =
  'inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 ease-out hover:bg-red-700 hover:shadow-md hover:shadow-red-600/30'

export default function DangerZoneCard({ onDataCleared }) {
  const { t } = useLanguage()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const runIfConfirmed = async (warning, action, doneMessage) => {
    if (!window.confirm(warning)) return
    setError('')
    try {
      await action()
      setMessage(doneMessage)
      onDataCleared?.()
    } catch (err) {
      setError(getApiErrorMessage(err, t('export.dangerZone.actionFailed')))
    }
  }

  const handleDeleteFeedback = () =>
    runIfConfirmed(
      t('export.dangerZone.confirmDeleteFeedback'),
      deleteAllProgramDataRequest,
      t('export.dangerZone.doneDeleteFeedback'),
    )

  const handleDeleteSchoolList = () =>
    runIfConfirmed(
      t('export.dangerZone.confirmDeleteSchools'),
      async () => {
        await deleteAllSchoolsRequest()
        saveSchoolExportCodes({})
      },
      t('export.dangerZone.doneDeleteSchools'),
    )

  const handleDeleteEverything = () =>
    runIfConfirmed(
      t('export.dangerZone.confirmDeleteEverything'),
      async () => {
        await Promise.all([deleteAllSchoolsRequest(), deleteAllProgramDataRequest()])
        saveSchoolExportCodes({})
        localStorage.removeItem(PROGRAMME_SETUP_STORAGE_KEY)
      },
      t('export.dangerZone.doneDeleteEverything'),
    )

  return (
    <section className="mt-8 rounded-3xl border border-red-200 bg-red-50/40 p-6 shadow-xl shadow-red-900/5 sm:p-8">
      <p className="text-xs font-semibold tracking-wide text-red-600 uppercase">{t('export.dangerZone.title')}</p>
      <p className="mt-1.5 max-w-2xl text-sm text-slate-600">{t('export.dangerZone.description')}</p>

      {message && (
        <p className="mt-3 animate-fade-in-up text-sm font-medium text-green-700">{message}</p>
      )}
      {error && <p className="mt-3 animate-fade-in-up text-sm font-medium text-red-600">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={handleDeleteFeedback} className={DANGER_BUTTON}>
          {t('export.dangerZone.deleteFeedback')}
        </button>
        <button type="button" onClick={handleDeleteSchoolList} className={DANGER_BUTTON}>
          {t('export.dangerZone.deleteSchools')}
        </button>
        <button type="button" onClick={handleDeleteEverything} className={DANGER_BUTTON_SOLID}>
          {t('export.dangerZone.deleteEverything')}
        </button>
      </div>
    </section>
  )
}
