import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { signupSchema, type SignupFormData } from '../model/schemas'
import { signUp, getDashboardRoute } from '../api/auth-api'
import { Button } from '@/shared/ui/button'
import { Input, Label } from '@/shared/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { ROUTES } from '@/shared/config/routes'
import { pt } from '@/shared/config/i18n/pt'

export function SignupForm() {
  const navigate = useNavigate()
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: 'patient' },
  })

  const role = watch('role')

  const mutation = useMutation({
    mutationFn: signUp,
    onSuccess: async (result) => {
      if (result.user) {
        navigate(getDashboardRoute((result.user.user_metadata?.role as import('@/shared/types/database').UserRole) ?? 'patient'))
      }
    },
  })

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{pt.auth.signup}</CardTitle>
        <CardDescription>{pt.app.tagline}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">{pt.auth.fullName}</Label>
            <Input id="fullName" {...register('fullName')} />
            {errors.fullName && <p className="text-sm text-red-600">{errors.fullName.message}</p>}
          </div>
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
          <div className="space-y-2">
            <Label>Perfil</Label>
            <Select value={role} onValueChange={(v) => setValue('role', v as SignupFormData['role'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="patient">{pt.auth.rolePatient}</SelectItem>
                <SelectItem value="physiotherapist">{pt.auth.rolePhysio}</SelectItem>
                <SelectItem value="caregiver">{pt.auth.roleCaregiver}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {mutation.error && <p className="text-sm text-red-600">{mutation.error.message}</p>}
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? pt.common.loading : pt.auth.signup}
          </Button>
          <p className="text-center text-sm">
            {pt.auth.hasAccount}{' '}
            <Link to={ROUTES.login} className="text-[var(--color-primary)] hover:underline">
              {pt.auth.login}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
