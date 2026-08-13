import { useState } from 'react'
import Modal from '../../../components/ui/Modal'
import Select from '../../../components/ui/Select'
import PasswordInput from '../../../components/ui/PasswordInput'
import Button from '../../../components/ui/Button'
import { deleteTour } from '../../../services/toursData.service'
import { getApiErrorMessage } from '../../../utils/apiErrorMessage'
import { useLanguage } from '../../../hooks/useLanguage'

// Delete Tour -> Select Tour -> Click Delete -> Password Confirmation ->
// Enter Super Admin Password -> Validate -> Delete. Works the same for the
// 3 existing tours and any Super-Admin-created one — this only removes the
// tour from the pool of tours offered/creatable going forward, it never
// touches feedback data already submitted for it.
export default function DeleteTourModal({ isOpen, onClose, tours, onDeleted }) {
  const { t } = useLanguage()
  const [step, setStep] = useState('select') // 'select' | 'password'
  const [tourId, setTourId] = useState('')
  const [tourError, setTourError] = useState('')
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetAndClose = () => {
    if (isSubmitting) return
    setStep('select')
    setTourId('')
    setTourError('')
    setPassword('')
    setPasswordError('')
    onClose()
  }

  const handleSelectSubmit = () => {
    if (!tourId) {
      setTourError(t('export.tourManagement.deleteForm.errors.tourRequired'))
      return
    }
    setStep('password')
  }

  const handlePasswordChange = (event) => {
    setPassword(event.target.value)
    if (passwordError) setPasswordError('')
  }

  const handleDelete = async () => {
    if (!password) return
    setIsSubmitting(true)
    setPasswordError('')
    try {
      await deleteTour(tourId, password)
      resetAndClose()
      onDeleted?.()
    } catch (err) {
      if (err?.response?.status === 403) {
        setPasswordError(t('export.tourManagement.password.incorrect'))
      } else {
        setPasswordError(getApiErrorMessage(err, t('export.tourManagement.deleteFailed')))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const tourOptions = tours.map((tour) => ({ value: tour.tourId, label: `${tour.tourName} (${tour.code})` }))

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} size="sm" closeOnBackdrop={!isSubmitting} showCloseButton={!isSubmitting}>
      {step === 'select' ? (
        <div className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">{t('export.tourManagement.deleteForm.title')}</h2>
          <p className="mt-2 text-sm text-slate-500">{t('export.tourManagement.deleteForm.description')}</p>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              handleSelectSubmit()
            }}
          >
            <div className="mt-5">
              <Select
                id="deleteTourSelect"
                label={t('export.tourManagement.deleteForm.tourLabel')}
                placeholder={t('export.tourManagement.deleteForm.tourPlaceholder')}
                options={tourOptions}
                value={tourId}
                onChange={(event) => {
                  setTourId(event.target.value)
                  setTourError('')
                }}
                error={tourError}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={resetAndClose} className="w-auto!">
                {t('common.cancel')}
              </Button>
              <Button type="submit" variant="danger" className="w-auto!">
                {t('export.tourManagement.deleteForm.confirmButton')}
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
              handleDelete()
            }}
          >
            <div className="mt-5">
              <PasswordInput
                id="deleteTourPassword"
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
                onClick={() => setStep('select')}
                disabled={isSubmitting}
                className="w-auto!"
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                variant="danger"
                isLoading={isSubmitting}
                disabled={isSubmitting || !password}
                className="w-auto!"
              >
                {t('export.tourManagement.deleteForm.confirmButton')}
              </Button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  )
}
