import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { loginSchema, type LoginFormData } from '../model/schemas'
import { signIn, getDashboardRoute, getProfile } from '../api/auth-api'
import { supabase } from '@/shared/api/supabase'
import { useAuth } from '../hooks/use-auth'
import { Button } from '@/shared/ui/button'
import { Input, Label } from '@/shared/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { ROUTES } from '@/shared/config/routes'
import { pt } from '@/shared/config/i18n/pt'

export function LoginForm() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const mutation = useMutation({
    mutationFn: signIn,
    onSuccess: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const p = await getProfile(session.user.id)
        navigate(getDashboardRoute(p.role as import('@/shared/types/database').UserRole))
      } else if (profile) {
        navigate(getDashboardRoute(profile.role))
      }
    },
  })

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{pt.auth.login}</CardTitle>
        <CardDescription>{pt.app.tagline}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{pt.auth.email}</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{pt.auth.password}</Label>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
          </div>
          {mutation.error && <p className="text-sm text-red-600">{mutation.error.message}</p>}
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? pt.common.loading : pt.auth.login}
          </Button>
          <div className="flex flex-col gap-2 text-center text-sm">
            <Link to={ROUTES.forgotPassword} className="text-[var(--color-primary)] hover:underline">
              {pt.auth.forgotPassword}
            </Link>
            <span>
              {pt.auth.noAccount}{' '}
              <Link to={ROUTES.signup} className="text-[var(--color-primary)] hover:underline">
                {pt.auth.signup}
              </Link>
            </span>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
