import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TextInput from '../../../components/ui/TextInput'
import PasswordInput from '../../../components/ui/PasswordInput'
import Checkbox from '../../../components/ui/Checkbox'
import Button from '../../../components/ui/Button'
import { useAuth } from '../../../hooks/useAuth'
import { useLanguage } from '../../../hooks/useLanguage'
import { validateLoginForm } from '../utils/validateLoginForm'
import { getApiErrorMessage } from '../../../utils/apiErrorMessage'
import { ROUTES } from '../../../utils/constants'

const INITIAL_FORM = { loginId: '', password: '' }

export default function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t } = useLanguage()

  const [form, setForm] = useState(INITIAL_FORM)
  const [rememberMe, setRememberMe] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    if (formError) setFormError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const errors = validateLoginForm(form, t)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsSubmitting(true)
    setFormError('')

    try {
      await login({ ...form, rememberMe })
      navigate(ROUTES.HOME, { replace: true })
    } catch (error) {
      setFormError(getApiErrorMessage(error, t('auth.signInError')))
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
        id="loginId"
        label={t('auth.loginIdLabel')}
        type="text"
        autoComplete="username"
        placeholder={t('auth.loginIdPlaceholder')}
        value={form.loginId}
        onChange={handleChange('loginId')}
        error={fieldErrors.loginId}
      />

      <PasswordInput
        id="password"
        label={t('auth.passwordLabel')}
        autoComplete="current-password"
        placeholder={t('auth.passwordPlaceholder')}
        value={form.password}
        onChange={handleChange('password')}
        error={fieldErrors.password}
      />

      <div className="flex items-center justify-between">
        <Checkbox
          id="rememberMe"
          label={t('auth.rememberMe')}
          checked={rememberMe}
          onChange={(event) => setRememberMe(event.target.checked)}
        />
        <button
          type="button"
          className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
        >
          {t('auth.forgotPassword')}
        </button>
      </div>

      <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
        {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
      </Button>
    </form>
  )
}
