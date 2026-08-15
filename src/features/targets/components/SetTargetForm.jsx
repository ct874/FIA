import { useEffect, useMemo, useState } from 'react'
import Modal from '../../../components/ui/Modal'
import Select from '../../../components/ui/Select'
import TextInput from '../../../components/ui/TextInput'
import Button from '../../../components/ui/Button'
import Spinner from '../../../components/ui/Spinner'
import { fetchTargetDistrictOptions, saveTarget } from '../../../services/targetData.service'
import { getApiErrorMessage } from '../../../utils/apiErrorMessage'
import { useLanguage } from '../../../hooks/useLanguage'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// Mirrors server/src/utils/academicPeriod.js's getCurrentFinancialYear() —
// there's no shared runtime between client and server, so the same
// "April-March, YYYY-YY" logic is reimplemented here purely to pre-fill the
// form (the field itself stays freely editable).
function getCurrentFinancialYearLabel() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const startYear = month >= 4 ? year : year - 1
  const endYearSuffix = String((startYear + 1) % 100).padStart(2, '0')
  return `${startYear}-${endYearSuffix}`
}

function buildEmptyForm() {
  return {
    financialYear: getCurrentFinancialYearLabel(),
    month: MONTH_NAMES[new Date().getMonth()],
    district: '',
    state: '',
    teacherTarget: '',
    studentTarget: '',
  }
}

function validate(form, t) {
  const errors = {}
  if (!form.financialYear.trim()) errors.financialYear = t('targets.form.errors.required')
  if (!form.month.trim()) errors.month = t('targets.form.errors.required')
  if (!form.district.trim()) errors.district = t('targets.form.errors.required')

  ;['teacherTarget', 'studentTarget'].forEach((field) => {
    const raw = form[field]
    if (raw === '' || raw === null || raw === undefined) {
      errors[field] = t('targets.form.errors.required')
      return
    }
    const num = Number(raw)
    if (!Number.isInteger(num) || num <= 0) {
      errors[field] = t('targets.form.errors.positiveInteger')
    }
  })

  return errors
}

// Full-screen "Set Target" workflow — Modal at size="full" gives the same
// dim backdrop + fade-in animation as every other modal in the app, just
// occupying most of the viewport instead of a centered dialog.
//
// The parent only mounts this component while the workflow is open (see
// TargetManagementPage), so every field starts fresh on each mount via
// plain useState initializers — no isOpen-triggered reset effect needed.
export default function SetTargetForm({ onClose, onSaved }) {
  const { t } = useLanguage()
  const [form, setForm] = useState(buildEmptyForm)
  const [errors, setErrors] = useState({})
  const [districtOptions, setDistrictOptions] = useState([])
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    let isMounted = true
    fetchTargetDistrictOptions()
      .then((options) => {
        if (isMounted) setDistrictOptions(options)
      })
      .catch((err) => {
        if (isMounted) setLoadError(getApiErrorMessage(err, t('targets.form.couldNotLoadDistricts')))
      })
      .finally(() => {
        if (isMounted) setIsLoadingDistricts(false)
      })
    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const monthOptions = useMemo(() => MONTH_NAMES.map((name) => ({ value: name, label: name })), [])
  const districtSelectOptions = useMemo(
    () => districtOptions.map((option) => ({ value: option.district, label: option.district })),
    [districtOptions],
  )

  const handleField = (field) => (event) => {
    const { value } = event.target
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      // District dropdown auto-fills State from real school records —
      // State is never independently editable, keeping it consistent with
      // actual registered schools.
      if (field === 'district') {
        const match = districtOptions.find((option) => option.district === value)
        next.state = match?.state || ''
      }
      return next
    })
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate(form, t)
    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return

    setIsSaving(true)
    setSaveError('')
    try {
      await saveTarget({
        financialYear: form.financialYear.trim(),
        month: form.month,
        district: form.district,
        state: form.state,
        teacherTarget: Number(form.teacherTarget),
        studentTarget: Number(form.studentTarget),
      })
      onSaved()
    } catch (err) {
      setSaveError(getApiErrorMessage(err, t('targets.form.saveFailed')))
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (isSaving) return
    onClose()
  }

  return (
    <Modal isOpen onClose={handleClose} size="full" closeOnBackdrop={!isSaving} showCloseButton={!isSaving}>
      <div className="p-6 sm:p-10">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{t('targets.form.title')}</h2>
        <p className="mt-1.5 max-w-2xl text-sm text-slate-500">{t('targets.form.description')}</p>

        {isLoadingDistricts ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-6 w-6 text-slate-400" />
          </div>
        ) : loadError ? (
          <p className="mt-6 text-sm font-medium text-red-600">{loadError}</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <TextInput
                id="targetFinancialYear"
                label={t('targets.form.financialYear')}
                placeholder="2026-27"
                value={form.financialYear}
                onChange={handleField('financialYear')}
                error={errors.financialYear}
                disabled={isSaving}
              />
              <Select
                id="targetMonth"
                label={t('targets.form.month')}
                options={monthOptions}
                value={form.month}
                onChange={handleField('month')}
                error={errors.month}
                disabled={isSaving}
              />
              <Select
                id="targetDistrict"
                label={t('targets.form.district')}
                placeholder={t('targets.form.districtPlaceholder')}
                options={districtSelectOptions}
                value={form.district}
                onChange={handleField('district')}
                error={errors.district}
                disabled={isSaving}
              />
              <TextInput
                id="targetState"
                label={t('targets.form.state')}
                value={form.state}
                placeholder={t('targets.form.statePlaceholder')}
                readOnly
                disabled
              />
              <TextInput
                id="targetTeacherTarget"
                label={t('targets.form.teacherTarget')}
                type="number"
                min="1"
                step="1"
                value={form.teacherTarget}
                onChange={handleField('teacherTarget')}
                error={errors.teacherTarget}
                disabled={isSaving}
              />
              <TextInput
                id="targetStudentTarget"
                label={t('targets.form.studentTarget')}
                type="number"
                min="1"
                step="1"
                value={form.studentTarget}
                onChange={handleField('studentTarget')}
                error={errors.studentTarget}
                disabled={isSaving}
              />
            </div>

            {saveError && <p className="mt-5 text-sm font-medium text-red-600">{saveError}</p>}

            <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-6">
              <Button type="button" variant="secondary" onClick={handleClose} disabled={isSaving} className="w-auto!">
                {t('common.cancel')}
              </Button>
              <Button type="submit" isLoading={isSaving} disabled={isSaving} className="w-auto! px-6">
                {t('common.save')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}
