import { useState } from 'react'
import Modal from '../../../components/ui/Modal'
import PasswordInput from '../../../components/ui/PasswordInput'
import Button from '../../../components/ui/Button'
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

// One consistent password-confirmation mechanism for every destructive
// Super Admin action on this page — "Delete All Feedback Data" and "Delete
// School List & Passwords" now go through the exact same modal/flow
// "Delete EVERYTHING (Full Reset)" already used, instead of each having its
// own confirmation UI (previously a plain window.confirm() for the first
// two, a password modal only for the third).
const DELETE_ACTIONS = {
  feedback: {
    labelKey: 'deleteFeedback',
    warningKey: 'confirmDeleteFeedback',
    doneKey: 'doneDeleteFeedback',
    request: deleteAllProgramDataRequest,
  },
  schools: {
    labelKey: 'deleteSchools',
    warningKey: 'confirmDeleteSchools',
    doneKey: 'doneDeleteSchools',
    request: deleteAllSchoolsRequest,
  },
  everything: {
    labelKey: 'deleteEverything',
    warningKey: 'resetWarning',
    doneKey: 'doneDeleteEverything',
    request: resetDatabaseRequest,
  },
}

export default function DangerZoneCard({ onDataCleared }) {
  const { t } = useLanguage()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [pendingAction, setPendingAction] = useState(null) // 'feedback' | 'schools' | 'everything' | null
  const [password, setPassword] = useState('')
  const [modalError, setModalError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const openModal = (action) => {
    setMessage('')
    setError('')
    setPassword('')
    setModalError('')
    setPendingAction(action)
  }

  const closeModal = () => {
    if (isSubmitting) return // don't let a stray click close the modal mid-request
    setPendingAction(null)
    setPassword('')
    setModalError('')
  }

  const handlePasswordChange = (event) => {
    setPassword(event.target.value)
    if (modalError) setModalError('')
  }

  const handleConfirm = async () => {
    if (!password || !pendingAction) return
    const action = DELETE_ACTIONS[pendingAction]

    setModalError('')
    setIsSubmitting(true)
    try {
      await action.request(password)
      if (pendingAction === 'everything') {
        localStorage.removeItem(PROGRAMME_SETUP_STORAGE_KEY)
      }
      setPendingAction(null)
      setPassword('')
      setMessage(t(`export.dangerZone.${action.doneKey}`))
      onDataCleared?.()
    } catch (err) {
      if (err?.response?.status === 403) {
        setModalError(t('export.dangerZone.incorrectPassword'))
      } else {
        setModalError(getApiErrorMessage(err, t('export.dangerZone.actionFailed')))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const activeAction = pendingAction ? DELETE_ACTIONS[pendingAction] : null

  return (
    <section className="mt-8 rounded-3xl border border-red-200 bg-red-50/40 p-6 shadow-xl shadow-red-900/5 sm:p-8">
      <p className="text-xs font-semibold tracking-wide text-red-600 uppercase">{t('export.dangerZone.title')}</p>
      <p className="mt-1.5 max-w-2xl text-sm text-slate-600">{t('export.dangerZone.description')}</p>

      {message && (
        <p className="mt-3 animate-fade-in-up text-sm font-medium text-green-700">{message}</p>
      )}
      {error && <p className="mt-3 animate-fade-in-up text-sm font-medium text-red-600">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={() => openModal('feedback')} className={DANGER_BUTTON}>
          {t('export.dangerZone.deleteFeedback')}
        </button>
        <button type="button" onClick={() => openModal('schools')} className={DANGER_BUTTON}>
          {t('export.dangerZone.deleteSchools')}
        </button>
        <button type="button" onClick={() => openModal('everything')} className={DANGER_BUTTON_SOLID}>
          {t('export.dangerZone.deleteEverything')}
        </button>
      </div>

      <Modal
        isOpen={Boolean(pendingAction)}
        onClose={closeModal}
        size="sm"
        closeOnBackdrop={!isSubmitting}
        showCloseButton={!isSubmitting}
      >
        {activeAction && (
          <div className="p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900">{t(`export.dangerZone.${activeAction.labelKey}`)}</h2>

            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
              <strong>{t('export.dangerZone.warningLabel')}</strong> {t(`export.dangerZone.${activeAction.warningKey}`)}
            </p>

            <form
              onSubmit={(event) => {
                event.preventDefault()
                handleConfirm()
              }}
            >
              <div className="mt-5">
                <PasswordInput
                  id="dangerZonePassword"
                  label={t('export.dangerZone.passwordLabel')}
                  placeholder={t('export.dangerZone.passwordPlaceholder')}
                  value={password}
                  onChange={handlePasswordChange}
                  error={modalError}
                  disabled={isSubmitting}
                  autoFocus
                  autoComplete="current-password"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={closeModal} disabled={isSubmitting} className={CANCEL_BUTTON}>
                  {t('common.cancel')}
                </button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  disabled={isSubmitting || !password}
                  className="w-auto! bg-red-600 px-5 hover:bg-red-700 focus-visible:ring-red-600"
                >
                  {t(`export.dangerZone.${activeAction.labelKey}`)}
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </section>
  )
}
