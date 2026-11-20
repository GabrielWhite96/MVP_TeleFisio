import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff } from 'lucide-react'
import { updatePasswordSchema, type UpdatePasswordFormData } from '../model/schemas'
import { getDashboardRoute, getProfile, updatePassword, verifyRecoveryOtp } from '../api/auth-api'
import {
  capturePasswordRecoveryFromUrl,
  clearPasswordRecovery,
  isExpiredAuthCallback,
  markPasswordRecovery,
  parseAuthCallback,
} from '../lib/password-recovery'
import { useAuth } from '../hooks/use-auth'
import { Button } from '@/shared/ui/button'
import { Input, Label } from '@/shared/ui/input'
import { LoadingSpinner } from '@/shared/ui/states'
import { ROUTES } from '@/shared/config/routes'
import { pt } from '@/shared/config/i18n/pt'
import { isNativeUi } from '@/shared/native'
import { cn } from '@/shared/lib/utils'
import type { UserRole } from '@/shared/types/database'

function ExpiredLinkPanel() {
  const native = isNativeUi()
  return (
    <div className="w-full">
      <h2
        className={cn(
          'font-display font-semibold tracking-tight',
          native ? 'text-2xl' : 'text-3xl'
        )}
      >
        {pt.auth.resetLinkExpiredTitle}
      </h2>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{pt.auth.resetLinkExpired}</p>
      <Button asChild size="lg" className={cn('mt-6 w-full', native && 'h-14 min-h-14')}>
        <Link to={ROUTES.forgotPassword}>{pt.auth.resetPassword}</Link>
      </Button>
    </div>
  )
}

export function ResetPasswordForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const native = isNativeUi()
  const { session, profile, isLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [otpExpired, setOtpExpired] = useState(false)
  const linkExpired = otpExpired || isExpiredAuthCallback(parseAuthCallback(location.search, location.hash))
  const [verifying, setVerifying] = useState(false)
  const [codePending, setCodePending] = useState(() => {
    if (typeof window === 'undefined') return false
    return new URLSearchParams(window.location.search).has('code')
  })
  const verifiedRef = useRef(false)
  const { register, handleSubmit, formState: { errors } } = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
  })

  useEffect(() => {
    if (verifiedRef.current || linkExpired) return
    const params = capturePasswordRecoveryFromUrl()
    if (!params.tokenHash || params.type !== 'recovery') return

    verifiedRef.current = true
    setVerifying(true)
    void verifyRecoveryOtp(params.tokenHash)
      .then(() => {
        markPasswordRecovery()
      })
      .catch(() => {
        setOtpExpired(true)
      })
      .finally(() => {
        setVerifying(false)
      })
  }, [linkExpired])

  useEffect(() => {
    if (!codePending) return
    if (session) {
      setCodePending(false)
      return
    }
    const timeoutId = window.setTimeout(() => setCodePending(false), 2500)
    return () => window.clearTimeout(timeoutId)
  }, [codePending, session])

  const mutation = useMutation({
    mutationFn: (data: UpdatePasswordFormData) => updatePassword(data.password),
    onSuccess: async () => {
      clearPasswordRecovery()
      if (profile) {
        navigate(getDashboardRoute(profile.role), { replace: true })
        return
      }
      if (session?.user) {
        const nextProfile = await getProfile(session.user.id)
        navigate(getDashboardRoute(nextProfile.role as UserRole), { replace: true })
        return
      }
      navigate(ROUTES.login, { replace: true })
    },
  })

  if (linkExpired) return <ExpiredLinkPanel />
  if (isLoading || verifying || codePending) {
    return <LoadingSpinner className="mx-auto h-8 w-8" />
  }
  if (!session) return <ExpiredLinkPanel />

  return (
    <div className="w-full">
      <h2
        className={cn(
          'font-display font-semibold tracking-tight',
          native ? 'text-2xl' : 'text-3xl'
        )}
      >
        {pt.auth.updatePasswordTitle}
      </h2>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
        {pt.auth.updatePasswordDescription}
      </p>
      <form
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
        className="mt-6 flex flex-col gap-5"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">{pt.auth.newPassword}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              enterKeyHint="next"
              className="pr-12"
              {...register('password')}
            />
            <button
              type="button"
              data-compact
              className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-xl text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? pt.auth.hidePassword : pt.auth.showPassword}
            >
              {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </button>
          </div>
          {errors.password ? (
            <p className="text-sm text-[var(--color-destructive)]" role="alert">
              {errors.password.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmPassword">{pt.auth.confirmPassword}</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            enterKeyHint="go"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword ? (
            <p className="text-sm text-[var(--color-destructive)]" role="alert">
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </div>
        {mutation.error ? (
          <p className="text-sm text-[var(--color-destructive)]" role="alert">
            {mutation.error.message}
          </p>
        ) : null}
        <Button
          type="submit"
          size="lg"
          className={cn('w-full', native && 'h-14 min-h-14')}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? pt.common.loading : pt.auth.saveNewPassword}
        </Button>
      </form>
    </div>
  )
}
