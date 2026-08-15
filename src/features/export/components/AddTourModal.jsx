import { useState } from 'react'
import Modal from '../../../components/ui/Modal'
import TextInput from '../../../components/ui/TextInput'
import PasswordInput from '../../../components/ui/PasswordInput'
import Button from '../../../components/ui/Button'
import { createTour } from '../../../services/toursData.service'
import { getApiErrorMessage } from '../../../utils/apiErrorMessage'
import { useLanguage } from '../../../hooks/useLanguage'

const INITIAL_FORM = { tourName: '', durationMinutes: '' }

// Add Tour -> Enter Tour Details -> Click Create Tour -> Password
// Confirmation Popup -> Enter Super Admin Password -> Validate -> Create.
// Two internal steps in one modal, same Modal/PasswordInput/Button pieces
// SetTargetPasswordModal.jsx already uses for its own password step.
export default function AddTourModal({ isOpen, onClose, onCreated }) {
  const { t } = useLanguage()
  const [step, setStep] = useState('details') // 'details' | 'password'
  const [form, setForm] = useState(INITIAL_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetAndClose = () => {
    if (isSubmitting) return
    setStep('details')
    setForm(INITIAL_FORM)
    setFormErrors({})
    setPassword('')
    setPasswordError('')
    onClose()
  }

  const handleFieldChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
    setFormErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validateDetails = () => {
    const errors = {}
    if (!form.tourName.trim()) {
      errors.tourName = t('export.tourManagement.addForm.errors.nameRequired')
    }
    const duration = Number(form.durationMinutes)
    if (!Number.isInteger(duration) || duration <= 0) {
      errors.durationMinutes = t('export.tourManagement.addForm.errors.durationRequired')
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleDetailsSubmit = () => {
    if (validateDetails()) setStep('password')
  }

  const handlePasswordChange = (event) => {
    setPassword(event.target.value)
    if (passwordError) setPasswordError('')
  }

  const handleCreate = async () => {
    if (!password) return
    setIsSubmitting(true)
    setPasswordError('')
    try {
      await createTour({
        tourName: form.tourName.trim(),
        durationMinutes: Number(form.durationMinutes),
        password,
      })
      resetAndClose()
      onCreated?.()
    } catch (err) {
      if (err?.response?.status === 403) {
        setPasswordError(t('export.tourManagement.password.incorrect'))
      } else {
        setPasswordError(getApiErrorMessage(err, t('export.tourManagement.createFailed')))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} size="sm" closeOnBackdrop={!isSubmitting} showCloseButton={!isSubmitting}>
      {step === 'details' ? (
        <div className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">{t('export.tourManagement.addForm.title')}</h2>
          <p className="mt-2 text-sm text-slate-500">{t('export.tourManagement.addForm.description')}</p>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              handleDetailsSubmit()
            }}
          >
            <div className="mt-5 space-y-4">
              <TextInput
                id="newTourName"
                label={t('export.tourManagement.addForm.tourName')}
                placeholder={t('export.tourManagement.addForm.tourNamePlaceholder')}
                value={form.tourName}
                onChange={handleFieldChange('tourName')}
                error={formErrors.tourName}
                autoFocus
              />
              <TextInput
                id="newTourDuration"
                type="number"
                min="1"
                step="1"
                label={t('export.tourManagement.addForm.durationMinutes')}
                placeholder={t('export.tourManagement.addForm.durationPlaceholder')}
                value={form.durationMinutes}
                onChange={handleFieldChange('durationMinutes')}
                error={formErrors.durationMinutes}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={resetAndClose} className="w-auto!">
                {t('common.cancel')}
              </Button>
              <Button type="submit" className="w-auto!">
                {t('export.tourManagement.addForm.nextButton')}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">{t('export.tourManagement.password.title')}</h2>
          <p className="mt-2 text-sm text-slate-500">{t('export.tourManagement.password.description')}</p>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              handleCreate()
            }}
          >
            <div className="mt-5">
              <PasswordInput
                id="addTourPassword"
                label={t('export.tourManagement.password.label')}
                placeholder={t('export.tourManagement.password.placeholder')}
                value={password}
                onChange={handlePasswordChange}
                error={passwordError}
                disabled={isSubmitting}
                autoFocus
                autoComplete="current-password"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep('details')}
                disabled={isSubmitting}
                className="w-auto!"
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting || !password} className="w-auto!">
                {t('export.tourManagement.password.continueLabel')}
              </Button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  )
}
