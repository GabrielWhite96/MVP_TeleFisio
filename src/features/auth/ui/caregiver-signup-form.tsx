import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { supabase, getSupabaseErrorMessage } from '@/shared/api/supabase'
import { getDashboardRoute } from '../api/auth-api'
import { Button } from '@/shared/ui/button'
import { Input, Label } from '@/shared/ui/input'
import { ROUTES } from '@/shared/config/routes'
import { pt } from '@/shared/config/i18n/pt'
import { isNativeUi } from '@/shared/native'
import { cn } from '@/shared/lib/utils'

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
})

type FormData = z.infer<typeof schema>

export function CaregiverSignupForm() {
  const navigate = useNavigate()
  const native = isNativeUi()
  const [params] = useSearchParams()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: params.get('email') ?? '' },
  })

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { data: result, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role: 'caregiver',
          },
        },
      })
      if (error) throw new Error(getSupabaseErrorMessage(error))
      return result
    },
    onSuccess: (result) => {
      if (result.user) navigate(getDashboardRoute('caregiver'))
    },
  })

  return (
    <div className="w-full">
      <h2
        className={cn(
          'font-display font-semibold tracking-tight',
          native ? 'text-2xl' : 'text-3xl'
        )}
      >
        Criar conta de cuidador
      </h2>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
        Disponível apenas se você recebeu um convite do paciente.
      </p>
      <form
        onSubmit={handleSubmit((d) => mutation.mutate(d))}
        className="mt-6 flex flex-col gap-5"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="fullName">{pt.auth.fullName}</Label>
          <Input id="fullName" autoComplete="name" enterKeyHint="next" {...register('fullName')} />
          {errors.fullName ? (
            <p className="text-sm text-[var(--color-destructive)]" role="alert">
              {errors.fullName.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">{pt.auth.email}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            inputMode="email"
            enterKeyHint="next"
            {...register('email')}
          />
          {errors.email ? (
            <p className="text-sm text-[var(--color-destructive)]" role="alert">
              {errors.email.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">{pt.auth.password}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            enterKeyHint="go"
            {...register('password')}
          />
          {errors.password ? (
            <p className="text-sm text-[var(--color-destructive)]" role="alert">
              {errors.password.message}
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
          {mutation.isPending ? pt.common.loading : pt.auth.signup}
        </Button>
        {!native ? (
          <p className="text-center text-sm">
            <Link to={ROUTES.login} className="text-[var(--color-primary)] hover:underline">
              {pt.auth.login}
            </Link>
          </p>
        ) : null}
      </form>
    </div>
  )
}
