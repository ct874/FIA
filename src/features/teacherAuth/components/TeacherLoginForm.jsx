import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TextInput from '../../../components/ui/TextInput'
import PasswordInput from '../../../components/ui/PasswordInput'
import Checkbox from '../../../components/ui/Checkbox'
import Button from '../../../components/ui/Button'
import { useTeacherAuth } from '../../../hooks/useTeacherAuth'
import { useLanguage } from '../../../hooks/useLanguage'
import { getApiErrorMessage } from '../../../utils/apiErrorMessage'
import { TEACHER_ROUTES } from '../../../utils/constants'

const INITIAL_FORM = { udise: '', password: '' }

export default function TeacherLoginForm() {
  const navigate = useNavigate()
  const { login } = useTeacherAuth()
  const { t } = useLanguage()

  const [form, setForm] = useState(INITIAL_FORM)
  const [rememberMe, setRememberMe] = useState(false)
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
    if (formError) setFormError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.udise.trim() || !form.password) {
      setFormError(t('teacherAuth.missingFields'))
      return
    }

    setIsSubmitting(true)
    setFormError('')

    try {
      await login({ ...form, rememberMe })
      navigate(TEACHER_ROUTES.DASHBOARD, { replace: true })
    } catch (error) {
      setFormError(getApiErrorMessage(error, t('teacherAuth.signInError')))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {formError && (
        <div
          role="alert"
          className="animate-fade-in-up rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
        >
          {formError}
        </div>
      )}

      <TextInput
        id="udise"
        label={t('teacherAuth.udiseLabel')}
        type="text"
        autoComplete="username"
        placeholder={t('teacherAuth.udisePlaceholder')}
        value={form.udise}
        onChange={handleChange('udise')}
      />

      <PasswordInput
        id="teacherPassword"
        label={t('teacherAuth.passwordLabel')}
        autoComplete="current-password"
        placeholder={t('teacherAuth.passwordPlaceholder')}
        value={form.password}
        onChange={handleChange('password')}
      />

      <div className="flex items-center justify-between">
        <Checkbox
          id="teacherRememberMe"
          label={t('teacherAuth.rememberMe')}
          checked={rememberMe}
          onChange={(event) => setRememberMe(event.target.checked)}
        />
      </div>

      <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
        {isSubmitting ? t('teacherAuth.signingIn') : t('teacherAuth.signIn')}
      </Button>
    </form>
  )
}
