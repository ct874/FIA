import { useState } from 'react'
import Modal from '../../../components/ui/Modal'
import PasswordInput from '../../../components/ui/PasswordInput'
import Button from '../../../components/ui/Button'
import { saveSchoolExportCodes } from '../../../services/schoolExportCodes.service'
import {
  deleteAllSchoolsRequest,
  deleteAllProgramDataRequest,
  resetDatabaseRequest,
} from '../../../api/schools.api'
import { PROGRAMME_SETUP_STORAGE_KEY } from '../utils/programmeSetup'
import { getApiErrorMessage } from '../../../utils/apiErrorMessage'
import { useLanguage } from '../../../hooks/useLanguage'

const DANGER_BUTTON =
  'inline-flex items-center justify-center rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-all duration-200 ease-out hover:border-red-600 hover:bg-red-600 hover:text-white hover:shadow-md hover:shadow-red-600/20'
const DANGER_BUTTON_SOLID =
  'inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 ease-out hover:bg-red-700 hover:shadow-md hover:shadow-red-600/30'
const CANCEL_BUTTON =
  'inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all duration-200 ease-out hover:bg-slate-50'

export default function DangerZoneCard({ onDataCleared }) {
  const { t } = useLanguage()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [resetPassword, setResetPassword] = useState('')
  const [resetError, setResetError] = useState('')
  const [isResetting, setIsResetting] = useState(false)

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

  const openResetModal = () => {
    setMessage('')
    setError('')
    setResetPassword('')
    setResetError('')
    setIsResetModalOpen(true)
  }

  const closeResetModal = () => {
    if (isResetting) return // don't let a stray click close the modal mid-request
    setIsResetModalOpen(false)
    setResetPassword('')
    setResetError('')
  }

  const handlePasswordChange = (event) => {
    setResetPassword(event.target.value)
    if (resetError) setResetError('')
  }

  const handleConfirmReset = async () => {
    if (!resetPassword) return
    setResetError('')
    setIsResetting(true)
    try {
      await resetDatabaseRequest(resetPassword)
      saveSchoolExportCodes({})
      localStorage.removeItem(PROGRAMME_SETUP_STORAGE_KEY)
      setIsResetModalOpen(false)
      setResetPassword('')
      setMessage(t('export.dangerZone.doneDeleteEverything'))
      onDataCleared?.()
    } catch (err) {
      if (err?.response?.status === 403) {
        setResetError(t('export.dangerZone.incorrectPassword'))
      } else {
        setResetError(getApiErrorMessage(err, t('export.dangerZone.actionFailed')))
      }
    } finally {
      setIsResetting(false)
    }
  }

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
        <button type="button" onClick={openResetModal} className={DANGER_BUTTON_SOLID}>
          {t('export.dangerZone.deleteEverything')}
        </button>
      </div>

      <Modal
        isOpen={isResetModalOpen}
        onClose={closeResetModal}
        size="sm"
        closeOnBackdrop={!isResetting}
        showCloseButton={!isResetting}
      >
        <div className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">{t('export.dangerZone.deleteEverything')}</h2>

          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
            <strong>{t('export.dangerZone.warningLabel')}</strong> {t('export.dangerZone.resetWarning')}
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              handleConfirmReset()
            }}
          >
            <div className="mt-5">
              <PasswordInput
                id="resetPassword"
                label={t('export.dangerZone.passwordLabel')}
                placeholder={t('export.dangerZone.passwordPlaceholder')}
                value={resetPassword}
                onChange={handlePasswordChange}
                error={resetError}
                disabled={isResetting}
                autoFocus
                autoComplete="current-password"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={closeResetModal} disabled={isResetting} className={CANCEL_BUTTON}>
                {t('common.cancel')}
              </button>
              <Button
                type="submit"
                isLoading={isResetting}
                disabled={isResetting || !resetPassword}
                className="w-auto! bg-red-600 px-5 hover:bg-red-700 focus-visible:ring-red-600"
              >
                {t('export.dangerZone.deleteEverything')}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </section>
  )
}
