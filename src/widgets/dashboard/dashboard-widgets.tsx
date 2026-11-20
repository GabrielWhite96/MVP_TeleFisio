import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/states'
import { MODALITY_LABELS, APPOINTMENT_STATUS_LABELS } from '@/shared/config/routes'
import { formatDateTime, isUpcoming } from '@/shared/lib/dates'
import { pt } from '@/shared/config/i18n/pt'

interface AppointmentItem {
  id: string
  modality: string
  status: string
  scheduled_at: string
  physiotherapist?: { profiles?: { full_name: string } | null } | null
  patient?: {
    full_name?: string | null
    profiles?: { full_name: string } | null
  } | null
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
          className="surface-tape flex items-center justify-between bg-[var(--color-card)] p-3 transition-colors hover:bg-[var(--color-accent)] md:p-4"
        >
          <div className="min-w-0">
            <p className="font-display text-base font-semibold md:text-lg">{formatDateTime(a.scheduled_at)}</p>
            <p className="truncate text-sm text-[var(--color-muted-foreground)]">
              {role === 'patient'
                ? a.physiotherapist?.profiles?.full_name
                : (a.patient?.full_name ?? a.patient?.profiles?.full_name)}
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Badge variant="secondary">{MODALITY_LABELS[a.modality]}</Badge>
              <Badge variant="outline">{APPOINTMENT_STATUS_LABELS[a.status]}</Badge>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
        </Link>
      ))}
    </div>
  )
}

export function NextAppointmentCard({
  appointment,
  loading,
  href,
}: {
  appointment: AppointmentItem | null | undefined
  loading?: boolean
  href?: string
}) {
  if (loading) return <Skeleton className="h-32 w-full" />

  const upcoming = appointment && isUpcoming(appointment.scheduled_at) ? appointment : null
  const body = upcoming ? (
    <div>
      <p className="text-base font-semibold md:text-lg">{formatDateTime(upcoming.scheduled_at)}</p>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        {upcoming.physiotherapist?.profiles?.full_name}
      </p>
      <Badge className="mt-2">{MODALITY_LABELS[upcoming.modality]}</Badge>
    </div>
  ) : (
    <p className="text-sm text-[var(--color-muted-foreground)]">{pt.common.noAppointment}</p>
  )

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{pt.patient.nextAppointment}</CardTitle>
      </CardHeader>
      <CardContent>
        {href && upcoming ? (
          <Link to={href} className="block rounded-md hover:bg-[var(--color-accent)]">
            {body}
          </Link>
        ) : body}
      </CardContent>
    </Card>
  )
}

export function StatCard({ title, value, loading }: { title: string; value: number | string; loading?: boolean }) {
  if (loading) return <Skeleton className="h-20 w-full" />
  return (
    <article className="surface-tape bg-[var(--color-card)] p-3 md:p-5">
      <p className="text-xs text-[var(--color-muted-foreground)] md:text-sm">{title}</p>
      <p className="mt-1.5 font-display text-2xl font-semibold tabular-nums leading-none md:mt-2 md:text-4xl">
        {value}
      </p>
    </article>
  )
}
