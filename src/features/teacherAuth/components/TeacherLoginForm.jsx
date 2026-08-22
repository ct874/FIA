import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TextInput from '../../../components/ui/TextInput'
import PasswordInput from '../../../components/ui/PasswordInput'
import Checkbox from '../../../components/ui/Checkbox'
import Button from '../../../components/ui/Button'
import { useTeacherAuth } from '../../../hooks/useTeacherAuth'
import { useLanguage } from '../../../hooks/useLanguage'
import { getApiErrorMessage } from '../../../utils/apiErrorMessage'
import { TEACHER_ROUTES, TEACHER_SESSION_EXPIRED_FLAG } from '../../../utils/constants'

const INITIAL_FORM = { udise: '', password: '' }

export default function TeacherLoginForm() {
  const navigate = useNavigate()
  const { login } = useTeacherAuth()
  const { t } = useLanguage()

  const [form, setForm] = useState(INITIAL_FORM)
  const [rememberMe, setRememberMe] = useState(false)
  // One-shot: TeacherAuthProvider sets TEACHER_SESSION_EXPIRED_FLAG right
  // before clearing a session that expired "underneath" an actively
  // browsing user (cross-tab logout or 30-hour inactivity) — read (only)
  // here so the very first render already shows a clear reason. Left in
  // sessionStorage until the effect below removes it, so this read is a
  // pure function of storage and safe to run twice (React Strict Mode).
  const [formError, setFormError] = useState(() => {
    try {
      return sessionStorage.getItem(TEACHER_SESSION_EXPIRED_FLAG) ? t('common.sessionExpired') : ''
    } catch {
      return ''
    }
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // The actual one-shot consumption (removing the flag) — separated from
  // the read above so it never reappears on a later visit that has
  // nothing to do with an expired session, without calling setState here.
  useEffect(() => {
    try {
      sessionStorage.removeItem(TEACHER_SESSION_EXPIRED_FLAG)
    } catch {
      // sessionStorage unavailable — nothing to clean up.
    }
  }, [])

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
