import { Link } from 'react-router-dom'
import { CalendarPlus, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/states'
import { MODALITY_LABELS, APPOINTMENT_STATUS_LABELS, ROUTES } from '@/shared/config/routes'
import { formatDateTime, isUpcoming } from '@/shared/lib/dates'
import { pt } from '@/shared/config/i18n/pt'

interface AppointmentItem {
  id: string
  modality: string
  status: string
  scheduled_at: string
  physiotherapist?: { profiles?: { full_name: string } | null } | null
  patient?: { profiles?: { full_name: string } | null } | null
}

export function AppointmentList({
  appointments,
  loading,
  role,
  emptyMessage,
}: {
  appointments: AppointmentItem[]
  loading?: boolean
  role: 'patient' | 'physiotherapist'
  emptyMessage?: string
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted-foreground)]">
        {emptyMessage ?? pt.common.empty}
      </p>
    )
  }

  const base = role === 'patient' ? '/patient/appointments' : '/physio/appointments'

  return (
    <div className="space-y-3">
      {appointments.map((a) => (
        <Link
          key={a.id}
          to={`${base}/${a.id}`}
          className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-[var(--color-accent)]"
        >
          <div>
            <p className="font-medium">{formatDateTime(a.scheduled_at)}</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {role === 'patient'
                ? a.physiotherapist?.profiles?.full_name
                : a.patient?.profiles?.full_name}
            </p>
            <div className="mt-1 flex gap-2">
              <Badge variant="secondary">{MODALITY_LABELS[a.modality]}</Badge>
              <Badge variant="outline">{APPOINTMENT_STATUS_LABELS[a.status]}</Badge>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-[var(--color-muted-foreground)]" />
        </Link>
      ))}
    </div>
  )
}

export function NextAppointmentCard({
  appointment,
  loading,
}: {
  appointment: AppointmentItem | null | undefined
  loading?: boolean
}) {
  if (loading) return <Skeleton className="h-32 w-full" />

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{pt.patient.nextAppointment}</CardTitle>
      </CardHeader>
      <CardContent>
        {appointment && isUpcoming(appointment.scheduled_at) ? (
          <div>
            <p className="text-lg font-semibold">{formatDateTime(appointment.scheduled_at)}</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {appointment.physiotherapist?.profiles?.full_name}
            </p>
            <Badge className="mt-2">{MODALITY_LABELS[appointment.modality]}</Badge>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[var(--color-muted-foreground)]">Nenhuma consulta agendada</p>
            <Button asChild size="sm">
              <Link to={ROUTES.patient.book}>
                <CalendarPlus className="mr-2 h-4 w-4" />
                {pt.patient.bookAppointment}
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function StatCard({ title, value, loading }: { title: string; value: number | string; loading?: boolean }) {
  if (loading) return <Skeleton className="h-24 w-full" />
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}
