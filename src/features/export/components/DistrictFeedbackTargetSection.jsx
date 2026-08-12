import { useCallback, useEffect, useState } from 'react'
import Modal from '../../../components/ui/Modal'
import PasswordInput from '../../../components/ui/PasswordInput'
import Button from '../../../components/ui/Button'
import {
  fetchDistrictFeedbackTargets,
  saveDistrictFeedbackTarget,
} from '../../../services/districtFeedbackTargetsData.service'
import { getApiErrorMessage } from '../../../utils/apiErrorMessage'
import { useLanguage } from '../../../hooks/useLanguage'

const CANCEL_BUTTON =
  'inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all duration-200 ease-out hover:bg-slate-50'
const SMALL_BUTTON =
  'inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-all duration-150 ease-out hover:bg-slate-700'
const SMALL_OUTLINE_BUTTON =
  'inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all duration-150 ease-out hover:bg-slate-50'
const NUMBER_INPUT =
  'w-24 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-900 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 focus:outline-none'

function validatePercent(value, t) {
  if (String(value).trim() === '') return t('export.districtFeedbackTargets.errors.required')
  const num = Number(value)
  if (!Number.isFinite(num) || num < 0 || num > 100) return t('export.districtFeedbackTargets.errors.range')
  return ''
}

// Select District -> Enter Percentage -> Click Save -> Password Popup ->
// Enter fia@123 -> Validate -> Save. Every district not explicitly
// configured here shows (and uses) the existing 40% default — see
// server/src/services/districtFeedbackTarget.service.js.
export default function DistrictFeedbackTargetSection() {
  const { t } = useLanguage()
  const [targets, setTargets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [editingDistrict, setEditingDistrict] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [editError, setEditError] = useState('')

  const [pendingSave, setPendingSave] = useState(null) // { district, targetPercent } | null
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  // `reportBusy` mirrors useTargetProgress()'s own pattern — the initial
  // mount load flips the spinner/surfaces errors, while a background
  // refetch (after saving) just swaps in fresh data quietly.
  const load = useCallback(
    (reportBusy) =>
      fetchDistrictFeedbackTargets()
        .then((data) => {
          setTargets(data)
          setLoadError('')
        })
        .catch((err) => {
          if (reportBusy) setLoadError(getApiErrorMessage(err, t('export.districtFeedbackTargets.couldNotLoad')))
        })
        .finally(() => {
          if (reportBusy) setIsLoading(false)
        }),
    [t],
  )

  useEffect(() => {
    load(true)
  }, [load])

  const startEdit = (target) => {
    setEditingDistrict(target.district)
    setEditValue(String(target.targetPercent))
    setEditError('')
    setMessage('')
  }

  const cancelEdit = () => {
    setEditingDistrict(null)
    setEditValue('')
    setEditError('')
  }

  const handleSaveClick = (district) => {
    const error = validatePercent(editValue, t)
    if (error) {
      setEditError(error)
      return
    }
    setPendingSave({ district, targetPercent: Number(editValue) })
  }

  const closePasswordModal = () => {
    if (isSubmitting) return
    setPendingSave(null)
    setPassword('')
    setPasswordError('')
  }

  const handlePasswordChange = (event) => {
    setPassword(event.target.value)
    if (passwordError) setPasswordError('')
  }

  const handleConfirmSave = async () => {
    if (!password || !pendingSave) return
    setIsSubmitting(true)
    setPasswordError('')
    try {
      await saveDistrictFeedbackTarget({ ...pendingSave, password })
      setPendingSave(null)
      setPassword('')
      setEditingDistrict(null)
      setMessage(t('export.districtFeedbackTargets.saveSuccess'))
      await load(false)
    } catch (err) {
      if (err?.response?.status === 403) {
        setPasswordError(t('export.districtFeedbackTargets.password.incorrect'))
      } else {
        setPasswordError(getApiErrorMessage(err, t('export.districtFeedbackTargets.saveFailed')))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-6 border-t border-slate-100 pt-6">
      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {t('export.districtFeedbackTargets.title')}
      </p>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">{t('export.districtFeedbackTargets.description')}</p>

      {message && <p className="mt-3 animate-fade-in-up text-xs font-medium text-green-600">{message}</p>}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="border-b border-slate-200 px-4 py-2 font-semibold text-slate-500">
                {t('export.districtFeedbackTargets.districtColumn')}
              </th>
              <th className="border-b border-slate-200 px-4 py-2 font-semibold text-slate-500">
                {t('export.districtFeedbackTargets.targetColumn')}
              </th>
              <th className="border-b border-slate-200 px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  …
                </td>
              </tr>
            ) : loadError ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-red-500">
                  {loadError}
                </td>
              </tr>
            ) : targets.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  {t('export.districtFeedbackTargets.empty')}
                </td>
              </tr>
            ) : (
              targets.map((target) => {
                const isEditing = editingDistrict === target.district
                return (
                  <tr key={target.district} className="odd:bg-white even:bg-slate-50/60">
                    <td className="border-b border-slate-100 px-4 py-2 text-slate-700">{target.district}</td>
                    <td className="border-b border-slate-100 px-4 py-2 text-slate-700">
                      {isEditing ? (
                        <div>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editValue}
                            onChange={(event) => {
                              setEditValue(event.target.value)
                              if (editError) setEditError('')
                            }}
                            className={NUMBER_INPUT}
                            autoFocus
                          />
                          <span className="ml-1.5 text-slate-500">%</span>
                          {editError && <p className="mt-1 text-xs font-medium text-red-500">{editError}</p>}
                        </div>
                      ) : (
                        `${target.targetPercent}%`
                      )}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-2 text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={cancelEdit} className={SMALL_OUTLINE_BUTTON}>
                            {t('export.districtFeedbackTargets.cancelButton')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveClick(target.district)}
                            className={SMALL_BUTTON}
                          >
                            {t('export.districtFeedbackTargets.saveButton')}
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => startEdit(target)} className={SMALL_OUTLINE_BUTTON}>
                          {t('export.districtFeedbackTargets.editButton')}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={Boolean(pendingSave)}
        onClose={closePasswordModal}
        size="sm"
        closeOnBackdrop={!isSubmitting}
        showCloseButton={!isSubmitting}
      >
        <div className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">{t('export.districtFeedbackTargets.password.title')}</h2>
          <p className="mt-2 text-sm text-slate-500">{t('export.districtFeedbackTargets.password.description')}</p>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              handleConfirmSave()
            }}
          >
            <div className="mt-5">
              <PasswordInput
                id="districtTargetPassword"
                label={t('export.districtFeedbackTargets.password.label')}
                placeholder={t('export.districtFeedbackTargets.password.placeholder')}
                value={password}
                onChange={handlePasswordChange}
                error={passwordError}
                disabled={isSubmitting}
                autoFocus
                autoComplete="current-password"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={closePasswordModal} disabled={isSubmitting} className={CANCEL_BUTTON}>
                {t('common.cancel')}
              </button>
              <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting || !password} className="w-auto!">
                {t('export.districtFeedbackTargets.password.continueLabel')}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  )
}
