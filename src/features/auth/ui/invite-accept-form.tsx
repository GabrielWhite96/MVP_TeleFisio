import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { inviteAcceptSchema, type InviteAcceptFormData } from '../model/schemas'
import { acceptPatientInvite, getDashboardRoute } from '../api/auth-api'
import { getPatientInviteByToken } from '@/entities/patient/api/patient-invite-api'
import { Button } from '@/shared/ui/button'
import { Input, Label } from '@/shared/ui/input'
import { LoadingSpinner } from '@/shared/ui/states'
import { ROUTES } from '@/shared/config/routes'
import { pt } from '@/shared/config/i18n/pt'
import { isNativeUi } from '@/shared/native'
import { cn } from '@/shared/lib/utils'

function InviteStatusPanel({
  title,
  description,
}: {
  title: string
  description: string
}) {
  const native = isNativeUi()
  return (
    <div className="w-full">
      <h2
        className={cn(
          'font-display font-semibold tracking-tight',
          native ? 'text-2xl' : 'text-3xl'
        )}
      >
        {title}
      </h2>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{description}</p>
      <Link
        to={ROUTES.login}
        className="mt-6 inline-block font-bold text-[var(--color-primary)] underline-offset-4 hover:underline"
      >
        {pt.auth.login}
      </Link>
    </div>
  )
}

export function InviteAcceptForm() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const native = isNativeUi()
  const inviteQuery = useQuery({
    queryKey: ['patient-invite', token],
    queryFn: () => getPatientInviteByToken(token!),
    enabled: !!token,
  })

  const { register, handleSubmit, formState: { errors } } = useForm<InviteAcceptFormData>({
    resolver: zodResolver(inviteAcceptSchema),
    values: inviteQuery.data
      ? { fullName: inviteQuery.data.patient_full_name, password: '' }
      : undefined,
  })

  const mutation = useMutation({
    mutationFn: (form: InviteAcceptFormData) =>
      acceptPatientInvite({
        email: inviteQuery.data!.email,
        inviteToken: token!,
        form,
      }),
    onSuccess: (result) => {
      if (result.user) navigate(getDashboardRoute('patient'))
    },
  })

  if (inviteQuery.isLoading) {
    return <LoadingSpinner className="mx-auto h-8 w-8" />
  }

  const invite = inviteQuery.data
  const invalid =
    !invite ||
    invite.status === 'expired' ||
    invite.status === 'revoked' ||
    (invite.status === 'pending' && new Date(invite.expires_at) <= new Date())

  if (invite?.status === 'accepted') {
    return (
      <InviteStatusPanel
        title={pt.auth.inviteAcceptedTitle}
        description={pt.auth.inviteAcceptedDescription}
      />
    )
  }

  if (invalid) {
    return (
      <InviteStatusPanel
        title={pt.auth.inviteInvalidTitle}
        description={pt.auth.inviteInvalidDescription}
      />
    )
  }

  return (
    <div className="w-full">
      <h2
        className={cn(
          'font-display font-semibold tracking-tight',
          native ? 'text-2xl' : 'text-3xl'
        )}
      >
        {pt.auth.inviteTitle}
      </h2>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)] text-pretty">
        {pt.auth.inviteDescription
          .replace('{physio}', invite.physiotherapist_name)
          .replace('{email}', invite.email)}
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
          <Label>{pt.auth.email}</Label>
          <Input value={invite.email} disabled />
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
          {mutation.isPending ? pt.common.loading : pt.auth.activateAccount}
        </Button>
      </form>
    </div>
  )
}
