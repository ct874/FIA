import { useState } from 'react'
import Modal from '../../../components/ui/Modal'
import PasswordInput from '../../../components/ui/PasswordInput'
import Button from '../../../components/ui/Button'
import { verifySetTargetAccess } from '../../../services/targetData.service'
import { getApiErrorMessage } from '../../../utils/apiErrorMessage'
import { useLanguage } from '../../../hooks/useLanguage'

const CANCEL_BUTTON =
  'inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all duration-200 ease-out hover:bg-slate-50'

// Directly modeled on DangerZoneCard's "re-enter password" modal — same
// button styles, same 403-vs-other-status error handling — for the "Set
// Target" access gate. This is a lightweight UI confirmation step; the real
// access control is the Super Admin session already required by every
// /api/targets endpoint.
export default function SetTargetPasswordModal({ isOpen, onClose, onVerified }) {
  const { t } = useLanguage()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  const handleClose = () => {
    if (isVerifying) return // don't let a stray click close the modal mid-request
    setPassword('')
    setError('')
    onClose()
  }

  const handleChange = (event) => {
    setPassword(event.target.value)
    if (error) setError('')
  }

  const handleSubmit = async () => {
    if (!password) return
    setError('')
    setIsVerifying(true)
    try {
      await verifySetTargetAccess(password)
      setPassword('')
      onVerified()
    } catch (err) {
      if (err?.response?.status === 403) {
        setError(t('targets.password.incorrect'))
      } else {
        setError(getApiErrorMessage(err, t('targets.password.failed')))
      }
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm" closeOnBackdrop={!isVerifying} showCloseButton={!isVerifying}>
      <div className="p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900">{t('targets.password.title')}</h2>
        <p className="mt-2 text-sm text-slate-500">{t('targets.password.description')}</p>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            handleSubmit()
          }}
        >
          <div className="mt-5">
            <PasswordInput
              id="setTargetPassword"
              label={t('targets.password.label')}
              placeholder={t('targets.password.placeholder')}
              value={password}
              onChange={handleChange}
              error={error}
              disabled={isVerifying}
              autoFocus
              autoComplete="current-password"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={handleClose} disabled={isVerifying} className={CANCEL_BUTTON}>
              {t('common.cancel')}
            </button>
            <Button type="submit" isLoading={isVerifying} disabled={isVerifying || !password} className="w-auto!">
              {t('targets.password.continueLabel')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
