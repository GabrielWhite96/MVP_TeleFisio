import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../model/schemas'
import { resetPassword } from '../api/auth-api'
import { Button } from '@/shared/ui/button'
import { Input, Label } from '@/shared/ui/input'
import { ROUTES } from '@/shared/config/routes'
import { pt } from '@/shared/config/i18n/pt'
import { isNativeUi } from '@/shared/native'
import { cn } from '@/shared/lib/utils'

export function ForgotPasswordForm() {
  const native = isNativeUi()
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const mutation = useMutation({ mutationFn: resetPassword })

  return (
    <div className="w-full">
      <h2
        className={cn(
          'font-display font-semibold tracking-tight',
          native ? 'text-2xl' : 'text-3xl'
        )}
      >
        {pt.auth.resetPassword}
      </h2>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
        Enviaremos um link de recuperação para seu e-mail.
      </p>
      <div className="mt-6">
        {mutation.isSuccess ? (
          <p className="text-center text-sm text-emerald-800">{pt.auth.resetSent}</p>
        ) : (
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{pt.auth.email}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                inputMode="email"
                enterKeyHint="go"
                {...register('email')}
              />
              {errors.email ? (
                <p className="text-sm text-[var(--color-destructive)]" role="alert">
                  {errors.email.message}
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
              {mutation.isPending ? pt.common.loading : pt.auth.resetPassword}
            </Button>
          </form>
        )}
        {!native ? (
          <p className="mt-4 text-center text-sm">
            <Link to={ROUTES.login} className="text-[var(--color-primary)] hover:underline">
              {pt.common.back}
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  )
}
