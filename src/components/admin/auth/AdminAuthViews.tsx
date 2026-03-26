'use client'

import { useEffect, useMemo, useState, useTransition, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth, useConfig, useTranslation } from '@payloadcms/ui'
import { formatAdminURL, getLoginOptions, getSafeRedirect } from 'payload/shared'

type LoginViewProps = {
  redirectTo?: string
}

type ResetViewProps = {
  token?: string
}

type AlertTone = 'error' | 'success' | 'info'

type AlertState = {
  message: string
  tone: AlertTone
} | null

type AuthFieldProps = {
  autoComplete?: string
  description?: string
  error?: string
  id: string
  label: string
  name: string
  onBlur?: () => void
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  type?: 'email' | 'password' | 'text'
  value: string
}

function validateEmailValue(value: string) {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return 'Enter your email address.'
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedValue)) {
    return 'Enter a valid email address.'
  }

  return true
}

function validateUsernameValue(value: string) {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return 'Enter your username.'
  }

  if (!/^[A-Za-z0-9._-]{2,}$/.test(normalizedValue)) {
    return 'Usernames must be at least 2 characters and can include letters, numbers, dots, underscores, and dashes.'
  }

  return true
}

function validateEmailOrUsernameValue(value: string) {
  if (validateEmailValue(value) === true || validateUsernameValue(value) === true) {
    return true
  }

  return 'Enter a valid email address or username.'
}

function validatePasswordValue(value: string) {
  if (!value) {
    return 'Enter a new password.'
  }

  if (value.length < 8) {
    return 'Use at least 8 characters.'
  }

  if (!/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/[0-9]/.test(value)) {
    return 'Include at least one uppercase letter, one lowercase letter, and one number.'
  }

  return true
}

function validateConfirmPasswordValue(value: string, passwordValue: string) {
  if (!value) {
    return 'Confirm the new password.'
  }

  if (value !== passwordValue) {
    return 'Passwords do not match.'
  }

  return true
}

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const json = await response.json()

    if (typeof json?.message === 'string' && json.message.trim().length > 0) {
      return json.message
    }

    if (Array.isArray(json?.errors)) {
      const nestedMessages = json.errors
        .flatMap((errorEntry: { data?: { errors?: Array<{ message?: string }> }; message?: string }) => {
          const messages: string[] = []

          if (typeof errorEntry?.message === 'string') {
            messages.push(errorEntry.message)
          }

          if (Array.isArray(errorEntry?.data?.errors)) {
            errorEntry.data.errors.forEach((child) => {
              if (typeof child?.message === 'string') {
                messages.push(child.message)
              }
            })
          }

          return messages
        })
        .find(Boolean)

      if (nestedMessages) {
        return nestedMessages
      }
    }
  } catch {
    // Ignore JSON parse failures and use the fallback message.
  }

  return fallback
}

function createPayloadFormData(payload: Record<string, unknown>) {
  const formData = new FormData()
  formData.append('_payload', JSON.stringify(payload))
  return formData
}

function AuthAlert({ alert }: { alert: AlertState }) {
  if (!alert) {
    return null
  }

  return (
    <div className={`admin-auth-alert admin-auth-alert--${alert.tone}`} role={alert.tone === 'error' ? 'alert' : 'status'}>
      <span className="admin-auth-alert__icon" aria-hidden="true">
        {alert.tone === 'error' ? '!' : alert.tone === 'success' ? '✓' : 'i'}
      </span>
      <p>{alert.message}</p>
    </div>
  )
}

function AuthField({
  autoComplete,
  description,
  error,
  id,
  label,
  name,
  onBlur,
  onChange,
  placeholder,
  required = true,
  type = 'text',
  value,
}: AuthFieldProps) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const actualType = isPassword && showPassword ? 'text' : type
  const describedBy = [description ? `${id}-description` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={`admin-auth-field${error ? ' admin-auth-field--error' : ''}`}>
      <label className="admin-auth-field__label" htmlFor={id}>
        <span>{label}</span>
        {required ? <span className="admin-auth-field__required">Required</span> : null}
      </label>

      <div className="admin-auth-field__control">
        <input
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? 'true' : 'false'}
          autoComplete={autoComplete}
          className="admin-auth-field__input"
          id={id}
          name={name}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          type={actualType}
          value={value}
        />

        {isPassword ? (
          <button
            aria-controls={id}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="admin-auth-field__toggle"
            onClick={() => setShowPassword((current) => !current)}
            type="button"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        ) : null}
      </div>

      {description ? (
        <p className="admin-auth-field__description" id={`${id}-description`}>
          {description}
        </p>
      ) : null}

      {error ? (
        <p className="admin-auth-field__error" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

function SubmitButton({ disabled, idleLabel, loadingLabel }: { disabled?: boolean; idleLabel: string; loadingLabel: string }) {
  return (
    <button aria-disabled={disabled ? 'true' : 'false'} aria-busy={disabled ? 'true' : 'false'} className="admin-auth-submit" disabled={disabled} type="submit">
      <span className="admin-auth-submit__content">
        {disabled ? <span className="admin-auth-submit__spinner" aria-hidden="true" /> : null}
        <span>{disabled ? loadingLabel : idleLabel}</span>
      </span>
    </button>
  )
}

function AuthShell({
  alert,
  children,
  footer,
  eyebrow,
  subtitle,
  title,
  variant,
}: {
  alert: AlertState
  children: ReactNode
  footer?: ReactNode
  eyebrow: string
  subtitle: string
  title: string
  variant: 'compact' | 'login'
}) {
  return (
    <div className={`admin-auth-shell admin-auth-shell--${variant}`}>
      <aside className="admin-auth-shell__brand" aria-hidden={variant === 'compact' ? 'true' : undefined}>
        <div className="admin-auth-shell__crest">✝</div>
        <p className="admin-auth-shell__eyebrow">Chancery Portal</p>
        <h2 className="admin-auth-shell__brandTitle">Catholic Eparchy of Segeneyti</h2>
        <p className="admin-auth-shell__brandText">
          Secure editorial access for diocesan news, events, parishes, publications, ministries, and site-wide settings.
        </p>
        <ul className="admin-auth-shell__highlights">
          <li>Trusted editorial access with Payload CMS authentication</li>
          <li>Responsive experience tuned for desktop, tablet, and mobile</li>
          <li>Warm liturgical palette aligned to the public site brand</li>
        </ul>
      </aside>

      <section className="admin-auth-shell__card">
        <div className="admin-auth-shell__cardHeader">
          <div className="admin-auth-shell__badge">✝</div>
          <p className="admin-auth-shell__eyebrow">{eyebrow}</p>
          <h1 className="admin-auth-shell__title">{title}</h1>
          <p className="admin-auth-shell__subtitle">{subtitle}</p>
        </div>

        <AuthAlert alert={alert} />

        <div className="admin-auth-shell__body">{children}</div>

        {footer ? <div className="admin-auth-shell__footer">{footer}</div> : null}
      </section>
    </div>
  )
}

export function AdminLoginView({ redirectTo }: LoginViewProps) {
  const router = useRouter()
  const [isRedirecting, startRedirect] = useTransition()
  const { config, getEntityConfig } = useConfig()
  const { i18n } = useTranslation()
  const { setUser, user } = useAuth()
  const [alert, setAlert] = useState<AlertState>(null)
  const [identifier, setIdentifier] = useState('')
  const [passwordValue, setPasswordValue] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    admin: { routes: adminRoutes, user: userSlug, autoLogin },
    routes: { admin: adminRoute, api: apiRoute },
  } = config

  const collectionConfig = getEntityConfig({ collectionSlug: userSlug })
  const loginWithUsername = collectionConfig?.auth?.loginWithUsername
  const { canLoginWithEmail, canLoginWithUsername } = getLoginOptions(loginWithUsername ?? false)

  const loginType = useMemo<'email' | 'emailOrUsername' | 'username'>(() => {
    if (canLoginWithEmail && canLoginWithUsername) {
      return 'emailOrUsername'
    }

    if (canLoginWithUsername) {
      return 'username'
    }

    return 'email'
  }, [canLoginWithEmail, canLoginWithUsername])

  useEffect(() => {
    if (typeof autoLogin === 'object' && autoLogin.prefillOnly) {
      if (loginType === 'username' || loginType === 'emailOrUsername') {
        setIdentifier(autoLogin.username ?? autoLogin.email ?? '')
      } else {
        setIdentifier(autoLogin.email ?? '')
      }

      setPasswordValue(autoLogin.password ?? '')
    }
  }, [autoLogin, loginType])

  const redirectUrl = useMemo(
    () =>
      getSafeRedirect({
        fallbackTo: adminRoute,
        redirectTo: redirectTo ?? adminRoute,
      }),
    [adminRoute, redirectTo],
  )

  useEffect(() => {
    if (!user) {
      return
    }

    startRedirect(() => {
      router.replace(redirectUrl)
    })
  }, [redirectUrl, router, startRedirect, user])

  const identifierError = touched.identifier
    ? loginType === 'email'
      ? validateEmailValue(identifier)
      : loginType === 'username'
        ? validateUsernameValue(identifier)
        : validateEmailOrUsernameValue(identifier)
    : true

  const passwordError = touched.password
    ? passwordValue.trim().length > 0
      ? true
      : 'Enter your password.'
    : true

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextTouched = { identifier: true, password: true }
    setTouched(nextTouched)
    setAlert(null)

    const validatedIdentifier =
      loginType === 'email'
        ? validateEmailValue(identifier)
        : loginType === 'username'
          ? validateUsernameValue(identifier)
          : validateEmailOrUsernameValue(identifier)
    const validatedPassword = passwordValue.trim().length > 0 ? true : 'Enter your password.'

    if (validatedIdentifier !== true || validatedPassword !== true) {
      setAlert({
        message: 'Please correct the highlighted fields and try again.',
        tone: 'error',
      })
      return
    }

    setIsSubmitting(true)

    const payload =
      loginType === 'email'
        ? { email: identifier, password: passwordValue }
        : { username: identifier, password: passwordValue }

    try {
      const response = await fetch(formatAdminURL({ adminRoute: apiRoute, path: `/${userSlug}/login` }), {
        body: createPayloadFormData(payload),
        credentials: 'include',
        headers: {
          'Accept-Language': i18n.language,
        },
        method: 'POST',
      })

      if (!response.ok) {
        const message = await parseErrorMessage(response, 'Unable to sign in with those credentials.')
        setAlert({ message, tone: 'error' })
        return
      }

      const json = (await response.json()) as {
        exp?: number
        token?: string
        user?: Record<string, unknown>
      }

      setUser(json as never)
      startRedirect(() => {
        router.push(redirectUrl)
      })
    } catch {
      setAlert({
        message: 'The sign-in request could not be completed. Check your connection and try again.',
        tone: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (user || isRedirecting) {
    return (
      <AuthShell
        alert={{ message: 'Redirecting to the admin dashboard…', tone: 'info' }}
        eyebrow="Administrator Sign In"
        subtitle="Your session is already active."
        title="Preparing your dashboard"
        variant="compact"
      >
        <div className="admin-auth-inlineMessage">You are already authenticated. One moment while we take you to the admin workspace.</div>
      </AuthShell>
    )
  }

  const loginLabel = loginType === 'email' ? 'Email address' : loginType === 'username' ? 'Username' : 'Email or username'
  const loginAutoComplete = loginType === 'email' ? 'email' : 'username'

  return (
    <AuthShell
      alert={alert}
      eyebrow="Administrator Sign In"
      footer={
        <div className="admin-auth-links admin-auth-links--spread">
          <Link className="admin-auth-link" href={formatAdminURL({ adminRoute, path: adminRoutes.forgot })} prefetch={false}>
            Forgot password?
          </Link>
          <span className="admin-auth-footnote">Authorized diocesan staff only</span>
        </div>
      }
      subtitle="Sign in to manage diocesan content, media, and site-wide settings with a secure editorial workflow."
      title="Welcome back"
      variant="login"
    >
      <form className="admin-auth-form" noValidate onSubmit={handleSubmit}>
        <AuthField
          autoComplete={loginAutoComplete}
          error={identifierError === true ? undefined : identifierError}
          id="admin-auth-identifier"
          label={loginLabel}
          name={loginType === 'email' ? 'email' : 'username'}
          onBlur={() => setTouched((current) => ({ ...current, identifier: true }))}
          onChange={(value) => setIdentifier(value)}
          placeholder={loginType === 'email' ? 'name@segeneyti.org' : 'Enter your login identifier'}
          type={loginType === 'email' ? 'email' : 'text'}
          value={identifier}
        />

        <AuthField
          autoComplete="current-password"
          error={passwordError === true ? undefined : passwordError}
          id="admin-auth-password"
          label="Password"
          name="password"
          onBlur={() => setTouched((current) => ({ ...current, password: true }))}
          onChange={(value) => setPasswordValue(value)}
          placeholder="Enter your password"
          type="password"
          value={passwordValue}
        />

        <div className="admin-auth-actions">
          <SubmitButton disabled={isSubmitting} idleLabel="Sign in" loadingLabel="Signing in…" />
        </div>
      </form>
    </AuthShell>
  )
}

export function AdminForgotPasswordView() {
  const { config, getEntityConfig } = useConfig()
  const { i18n } = useTranslation()
  const { user } = useAuth()
  const [value, setValue] = useState('')
  const [touched, setTouched] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [alert, setAlert] = useState<AlertState>(null)
  const [submitted, setSubmitted] = useState(false)

  const {
    admin: { routes: adminRoutes, user: userSlug },
    routes: { admin: adminRoute, api: apiRoute },
  } = config

  const collectionConfig = getEntityConfig({ collectionSlug: userSlug })
  const loginWithUsername = collectionConfig?.auth?.loginWithUsername

  const valueError = touched
    ? loginWithUsername
      ? validateUsernameValue(value)
      : validateEmailValue(value)
    : true

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTouched(true)
    setAlert(null)

    const validationResult = loginWithUsername
      ? validateUsernameValue(value)
      : validateEmailValue(value)

    if (validationResult !== true) {
      setAlert({ message: 'Please enter a valid account identifier to continue.', tone: 'error' })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(formatAdminURL({ adminRoute: apiRoute, path: `/${userSlug}/forgot-password` }), {
        body: createPayloadFormData(loginWithUsername ? { username: value } : { email: value }),
        credentials: 'include',
        headers: {
          'Accept-Language': i18n.language,
        },
        method: 'POST',
      })

      if (!response.ok) {
        const message = await parseErrorMessage(response, 'We could not start the password reset request.')
        setAlert({ message, tone: 'error' })
        return
      }

      setSubmitted(true)
      setAlert({
        message: loginWithUsername
          ? 'If that username exists, a reset link has been prepared. Check the configured delivery channel or your development logs.'
          : 'If that email exists, a reset link has been prepared. Check the mailbox or your development logs.',
        tone: 'success',
      })
    } catch {
      setAlert({ message: 'The reset request could not be completed. Please try again.', tone: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (user) {
    return (
      <AuthShell
        alert={{ message: 'You are already signed in. Change your password from the account area if needed.', tone: 'info' }}
        eyebrow="Password Assistance"
        footer={
          <Link className="admin-auth-link" href={adminRoute} prefetch={false}>
            Back to dashboard
          </Link>
        }
        subtitle="Authenticated users should manage credentials from the admin account settings."
        title="You are already signed in"
        variant="compact"
      >
        <div className="admin-auth-inlineMessage">Open your account screen from the dashboard if you need to change the current password.</div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      alert={alert}
      eyebrow="Password Assistance"
      footer={
        <div className="admin-auth-links admin-auth-links--spread">
          <Link className="admin-auth-link" href={formatAdminURL({ adminRoute, path: adminRoutes.login })} prefetch={false}>
            Back to login
          </Link>
          <span className="admin-auth-footnote">Reset links are single-use and time limited</span>
        </div>
      }
      subtitle="Enter the account email to receive a reset link. In development without a live email provider, the reset link is written to the server logs."
      title={submitted ? 'Check your inbox' : 'Forgot your password?'}
      variant="compact"
    >
      {submitted ? (
        <div className="admin-auth-confirmation">
          <p>
            We have processed the request. If the account exists, follow the reset link that was emailed to you or printed in the development server logs.
          </p>
          <p className="admin-auth-confirmation__note">
            Didn’t receive anything? Wait a moment, then verify the address and try again.
          </p>
        </div>
      ) : (
        <form className="admin-auth-form" noValidate onSubmit={handleSubmit}>
          <AuthField
            autoComplete={loginWithUsername ? 'username' : 'email'}
            description={loginWithUsername ? 'Use the username assigned to your editorial account.' : 'Use the email address tied to your editorial account.'}
            error={valueError === true ? undefined : valueError}
            id="admin-auth-forgot-identifier"
            label={loginWithUsername ? 'Username' : 'Email address'}
            name={loginWithUsername ? 'username' : 'email'}
            onBlur={() => setTouched(true)}
            onChange={(nextValue) => setValue(nextValue)}
            placeholder={loginWithUsername ? 'Enter your username' : 'name@segeneyti.org'}
            type={loginWithUsername ? 'text' : 'email'}
            value={value}
          />

          <div className="admin-auth-actions">
            <SubmitButton disabled={isSubmitting} idleLabel="Send reset link" loadingLabel="Sending…" />
          </div>
        </form>
      )}
    </AuthShell>
  )
}

export function AdminResetPasswordView({ token }: ResetViewProps) {
  const router = useRouter()
  const [isRedirecting, startRedirect] = useTransition()
  const { config } = useConfig()
  const { i18n } = useTranslation()
  const { fetchFullUser, setUser, user } = useAuth()
  const [passwordValue, setPasswordValue] = useState('')
  const [confirmValue, setConfirmValue] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [alert, setAlert] = useState<AlertState>(null)

  const {
    admin: { routes: adminRoutes, user: userSlug },
    routes: { admin: adminRoute, api: apiRoute },
  } = config

  const passwordError = touched.password ? validatePasswordValue(passwordValue) : true
  const confirmError = touched.confirm ? validateConfirmPasswordValue(confirmValue, passwordValue) : true

  if (!token) {
    return (
      <AuthShell
        alert={{ message: 'This reset link is incomplete. Request a new password reset email to continue.', tone: 'error' }}
        eyebrow="Reset Password"
        footer={
          <Link className="admin-auth-link" href={formatAdminURL({ adminRoute, path: adminRoutes.forgot })} prefetch={false}>
            Request a fresh reset link
          </Link>
        }
        subtitle="A valid reset token is required to continue."
        title="Invalid reset link"
        variant="compact"
      >
        <div className="admin-auth-inlineMessage">The token was missing from the URL, so the password cannot be reset.</div>
      </AuthShell>
    )
  }

  if (user) {
    return (
      <AuthShell
        alert={{ message: 'Your account is already authenticated. Use the dashboard if you need to continue.', tone: 'info' }}
        eyebrow="Reset Password"
        footer={
          <Link className="admin-auth-link" href={adminRoute} prefetch={false}>
            Back to dashboard
          </Link>
        }
        subtitle="Authenticated users do not need a reset token to access the admin panel."
        title="You are already signed in"
        variant="compact"
      >
        <div className="admin-auth-inlineMessage">If you intended to reset a different account, sign out first and reopen the reset link.</div>
      </AuthShell>
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTouched({ confirm: true, password: true })
    setAlert(null)

    const validatedPassword = validatePasswordValue(passwordValue)
    const validatedConfirm = validateConfirmPasswordValue(confirmValue, passwordValue)

    if (validatedPassword !== true || validatedConfirm !== true) {
      setAlert({ message: 'Please correct the highlighted password fields and try again.', tone: 'error' })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(formatAdminURL({ adminRoute: apiRoute, path: `/${userSlug}/reset-password` }), {
        body: createPayloadFormData({ password: passwordValue, token }),
        credentials: 'include',
        headers: {
          'Accept-Language': i18n.language,
        },
        method: 'POST',
      })

      if (!response.ok) {
        const message = await parseErrorMessage(response, 'This reset link is invalid or has expired. Request a new reset email and try again.')
        setAlert({ message, tone: 'error' })
        return
      }

      const json = (await response.json()) as {
        token?: string
        user?: Record<string, unknown>
      }

      if (json?.token && json?.user) {
        setUser(json as never)
        startRedirect(() => {
          router.push(adminRoute)
        })
        return
      }

      const refreshedUser = await fetchFullUser()

      startRedirect(() => {
        router.push(refreshedUser ? adminRoute : formatAdminURL({ adminRoute, path: adminRoutes.login }))
      })
    } catch {
      setAlert({ message: 'The password could not be reset. Please try again.', tone: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      alert={isRedirecting ? { message: 'Password updated. Redirecting…', tone: 'success' } : alert}
      eyebrow="Reset Password"
      footer={
        <div className="admin-auth-links admin-auth-links--spread">
          <Link className="admin-auth-link" href={formatAdminURL({ adminRoute, path: adminRoutes.login })} prefetch={false}>
            Back to login
          </Link>
          <Link className="admin-auth-link" href={formatAdminURL({ adminRoute, path: adminRoutes.forgot })} prefetch={false}>
            Need a fresh link?
          </Link>
        </div>
      }
      subtitle="Choose a new password for your diocesan editorial account. Use a strong passphrase you do not reuse elsewhere."
      title="Set a new password"
      variant="compact"
    >
      <form className="admin-auth-form" noValidate onSubmit={handleSubmit}>
        <AuthField
          autoComplete="new-password"
          description="Use a strong, memorable password. Password rules are enforced before submission."
          error={passwordError === true ? undefined : passwordError}
          id="admin-auth-new-password"
          label="New password"
          name="password"
          onBlur={() => setTouched((current) => ({ ...current, password: true }))}
          onChange={(value) => setPasswordValue(value)}
          placeholder="Create a new password"
          type="password"
          value={passwordValue}
        />

        <AuthField
          autoComplete="new-password"
          error={confirmError === true ? undefined : confirmError}
          id="admin-auth-confirm-password"
          label="Confirm password"
          name="confirm-password"
          onBlur={() => setTouched((current) => ({ ...current, confirm: true }))}
          onChange={(value) => setConfirmValue(value)}
          placeholder="Repeat the new password"
          type="password"
          value={confirmValue}
        />

        <div className="admin-auth-actions">
          <SubmitButton disabled={isSubmitting || isRedirecting} idleLabel="Reset password" loadingLabel="Updating…" />
        </div>
      </form>
    </AuthShell>
  )
}