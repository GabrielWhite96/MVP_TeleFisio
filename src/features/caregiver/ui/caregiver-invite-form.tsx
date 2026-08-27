import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCaregiverInvite, getCaregiverInvites, revokeCaregiverInvite } from '@/entities/caregiver/api/caregiver-invite-api'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { queryKeys } from '@/shared/api/query-keys'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input, Label } from '@/shared/ui/input'
import { Badge } from '@/shared/ui/badge'
import { formatDateTime } from '@/shared/lib/dates'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
})

type FormData = z.infer<typeof schema>

export function CaregiverInviteForm({ patientId }: { patientId: string }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const invitesQuery = useQuery({
    queryKey: queryKeys.caregiverInvites(patientId),
    queryFn: () => getCaregiverInvites(patientId),
  })

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      createCaregiverInvite({
        patientId,
        email: data.email,
        invitedBy: user!.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.caregiverInvites(patientId) })
      reset()
    },
  })

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeCaregiverInvite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.caregiverInvites(patientId) })
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Convidar familiar por e-mail</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Se a pessoa ainda não tem conta de cuidador, o convite fica pendente. Ao criar a conta com o
          mesmo e-mail, ela poderá aceitar no dashboard.
        </p>
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="flex flex-wrap gap-3">
          <div className="min-w-[220px] flex-1 space-y-2">
            <Label>E-mail do familiar</Label>
            <Input type="email" {...register('email')} />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={createMutation.isPending}>Enviar convite</Button>
          </div>
        </form>
        {createMutation.isSuccess && (
          <p className="text-sm text-green-600">Convite criado. Peça para o familiar entrar como cuidador.</p>
        )}
        {createMutation.error && (
          <p className="text-sm text-red-600">{(createMutation.error as Error).message}</p>
        )}
        <div className="space-y-2">
          {invitesQuery.data?.map((invite) => (
            <div key={invite.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
              <div>
                <p className="font-medium">{invite.email}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Expira {formatDateTime(invite.expires_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{invite.status}</Badge>
                {invite.status === 'pending' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => revokeMutation.mutate(invite.id)}
                  >
                    Revogar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
