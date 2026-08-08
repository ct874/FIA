import { useEffect, useMemo, useState } from 'react'
import DashboardTable from '../../../components/table/DashboardTable'
import Spinner from '../../../components/ui/Spinner'
import ErrorState from '../../../components/ui/ErrorState'
import Modal from '../../../components/ui/Modal'
import PasswordInput from '../../../components/ui/PasswordInput'
import Button from '../../../components/ui/Button'
import { getFullSchoolDirectory } from '../../../services/schoolDirectory.service'
import { updateSchoolExportCodesRequest } from '../../../api/schools.api'
import { getApiErrorMessage } from '../../../utils/apiErrorMessage'
import { useLanguage } from '../../../hooks/useLanguage'

const CODE_INPUT_CLASSES =
  'w-32 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-900 transition-all duration-150 ease-out focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 disabled:opacity-80'
const SAVE_BUTTON =
  'inline-flex shrink-0 items-center justify-center rounded-xl bg-amber-500 px-5 py-2 text-sm font-semibold text-white transition-all duration-200 ease-out hover:bg-amber-600 hover:shadow-md hover:shadow-amber-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:bg-amber-500'
const CANCEL_BUTTON =
  'inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all duration-200 ease-out hover:bg-slate-50'

// District Code / Postal Code are backend-persisted, password-confirmed,
// and permanently locked once saved (see school.controller.js's
// updateSchoolExportCodes) — a field only stays editable while its
// backend value is still blank.
export default function PerSchoolExportCodesTable({ directoryVersion }) {
  const { t } = useLanguage()
  const [directory, setDirectory] = useState(null)
  const [error, setError] = useState(null)
  const isDirectoryLoading = directory === null

  // In-progress, unsaved edits keyed by UDISE — only ever consulted for a
  // school+field that isn't locked yet (backend value still blank).
  const [drafts, setDrafts] = useState({})

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [modalError, setModalError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const loadDirectory = () => {
    setError(null)
    getFullSchoolDirectory()
      .then((result) => setDirectory(result))
      .catch((err) => setError(getApiErrorMessage(err, t('export.perSchoolCodes.loadError'))))
  }

  useEffect(() => {
    let isMounted = true
    getFullSchoolDirectory()
      .then((result) => {
        if (isMounted) setDirectory(result)
      })
      .catch((err) => {
        if (isMounted) setError(getApiErrorMessage(err, t('export.perSchoolCodes.loadError')))
      })
    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directoryVersion])

  const handleDraftChange = (udise, field) => (event) => {
    const { value } = event.target
    setDrafts((prev) => ({ ...prev, [udise]: { ...prev[udise], [field]: value } }))
    setSuccessMessage('')
  }

  // Schools with a newly-entered (still unsaved, still unlocked) value for
  // District Code and/or Postal Code — exactly what "Save Changes" will
  // send once the password is confirmed.
  const pendingChanges = useMemo(() => {
    if (!directory) return []
    return directory
      .map((school) => {
        const draft = drafts[school.udise] || {}
        const districtCode = !school.districtCode ? (draft.districtCode ?? '').trim() : ''
        const postalCode = !school.postalCode ? (draft.postalCode ?? '').trim() : ''
        return { udise: school.udise, districtCode, postalCode }
      })
      .filter((entry) => entry.districtCode || entry.postalCode)
  }, [directory, drafts])

  const openSaveModal = () => {
    setPassword('')
    setModalError('')
    setIsSaveModalOpen(true)
  }

  const closeSaveModal = () => {
    if (isSaving) return // don't let a stray click close the modal mid-request
    setIsSaveModalOpen(false)
    setPassword('')
    setModalError('')
  }

  const handlePasswordChange = (event) => {
    setPassword(event.target.value)
    if (modalError) setModalError('')
  }

  const handleConfirmSave = async () => {
    if (!password || pendingChanges.length === 0) return
    setModalError('')
    setIsSaving(true)
    try {
      // Sequential, not parallel: keeps the outcome simple to reason about
      // (one wrong-password response can't leave some schools saved and
      // others not from the same submission).
      const savedByUdise = {}
      for (const change of pendingChanges) {
        const { data } = await updateSchoolExportCodesRequest(change.udise, {
          districtCode: change.districtCode,
          postalCode: change.postalCode,
          password,
        })
        savedByUdise[change.udise] = data.data
      }

      setDirectory((prev) => prev.map((school) => (savedByUdise[school.udise] ? { ...school, ...savedByUdise[school.udise] } : school)))
      setDrafts({})
      setIsSaveModalOpen(false)
      setPassword('')
      setSuccessMessage(t('export.perSchoolCodes.saveSuccess'))
    } catch (err) {
      if (err?.response?.status === 403) {
        setModalError(t('export.dangerZone.incorrectPassword'))
      } else {
        setModalError(getApiErrorMessage(err, t('export.perSchoolCodes.saveError')))
      }
    } finally {
      setIsSaving(false)
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'schoolName',
        label: t('home.registered.columns.school'),
        sortable: true,
        render: (row) => (
          <div>
            <p className="font-medium text-slate-900">{row.schoolName}</p>
            <p className="text-xs text-slate-400">{row.udise}</p>
          </div>
        ),
      },
      {
        key: 'districtCode',
        label: t('export.perSchoolCodes.districtCode'),
        render: (row) => {
          const isLocked = Boolean(row.districtCode)
          return (
            <input
              type="text"
              placeholder={t('export.perSchoolCodes.districtCodePlaceholder')}
              value={isLocked ? row.districtCode : (drafts[row.udise]?.districtCode ?? '')}
              disabled={isLocked || isSaving}
              onChange={handleDraftChange(row.udise, 'districtCode')}
              className={CODE_INPUT_CLASSES}
            />
          )
        },
      },
      {
        key: 'postalCode',
        label: t('export.perSchoolCodes.postalCode'),
        render: (row) => {
          const isLocked = Boolean(row.postalCode)
          return (
            <input
              type="text"
              placeholder={t('export.perSchoolCodes.postalCodePlaceholder')}
              value={isLocked ? row.postalCode : (drafts[row.udise]?.postalCode ?? '')}
              disabled={isLocked || isSaving}
              onChange={handleDraftChange(row.udise, 'postalCode')}
              className={CODE_INPUT_CLASSES}
            />
          )
        },
      },
    ],
    [drafts, isSaving, t],
  )

  return (
    <div className="mt-6">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {t('export.perSchoolCodes.title')}
          </p>
          <p className="text-sm text-slate-500">{t('export.perSchoolCodes.description', { example: 'S08116' })}</p>
        </div>
        <button
          type="button"
          onClick={openSaveModal}
          disabled={pendingChanges.length === 0}
          className={`${SAVE_BUTTON} shrink-0`}
        >
          {t('export.perSchoolCodes.saveChanges')}
        </button>
      </div>

      {successMessage && (
        <p className="mb-3 animate-fade-in-up text-xs font-medium text-green-600">{successMessage}</p>
      )}

      {isDirectoryLoading && !error ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-slate-400" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={loadDirectory} />
      ) : (
        <DashboardTable
          columns={columns}
          data={directory}
          searchKeys={['schoolName', 'udise']}
          searchPlaceholder={t('export.perSchoolCodes.searchPlaceholder')}
          emptyMessage={directory.length === 0 ? t('export.perSchoolCodes.emptyAll') : t('export.perSchoolCodes.emptySearch')}
        />
      )}

      <Modal
        isOpen={isSaveModalOpen}
        onClose={closeSaveModal}
        size="sm"
        closeOnBackdrop={!isSaving}
        showCloseButton={!isSaving}
      >
        <div className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">{t('export.perSchoolCodes.saveChanges')}</h2>
          <p className="mt-2 text-sm text-slate-500">{t('export.perSchoolCodes.passwordPrompt')}</p>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              handleConfirmSave()
            }}
          >
            <div className="mt-5">
              <PasswordInput
                id="exportCodesPassword"
                label={t('export.dangerZone.passwordLabel')}
                placeholder={t('export.dangerZone.passwordPlaceholder')}
                value={password}
                onChange={handlePasswordChange}
                error={modalError}
                disabled={isSaving}
                autoFocus
                autoComplete="current-password"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={closeSaveModal} disabled={isSaving} className={CANCEL_BUTTON}>
                {t('common.cancel')}
              </button>
              <Button type="submit" isLoading={isSaving} disabled={isSaving || !password} className="w-auto! px-5">
                {t('export.perSchoolCodes.saveChanges')}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  )
}
