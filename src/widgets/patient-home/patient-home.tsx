import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, CheckCircle2, ChevronRight, HeartPulse, UserRound } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/states'
import { MotionArc } from '@/shared/ui/motion-arc'
import { ROUTES, CLINICAL_STATUS_LABELS, MODALITY_LABELS } from '@/shared/config/routes'
import { pt } from '@/shared/config/i18n/pt'
import { formatDateTime } from '@/shared/lib/dates'
import { cn } from '@/shared/lib/utils'

function greetingForNow(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return pt.auth.greeting
  if (hour < 18) return pt.auth.greetingAfternoon
  return pt.auth.greetingEvening
}

export function PatientGreeting({ firstName }: { firstName: string }) {
  const greeting = greetingForNow()

  return (
    <header>
      <h1 className="font-display text-[1.75rem] font-semibold leading-[1.1] tracking-tight text-pretty md:text-[clamp(2.4rem,6vw,4.75rem)] md:leading-[0.9]">
        <span className="block">
          {greeting}
          {firstName ? `, ${firstName}` : ''}
        </span>
      </h1>
    </header>
  )
}

type DueExercise = {
  id: string
  exercise?: { title?: string } | null
}

type HomeAppointment = {
  id: string
  modality: string
  scheduled_at: string
  physiotherapist?: { profiles?: { full_name: string } | null } | null
}

type TodayCheckIn = {
  pain_level: number | null
}

export function PatientTodayHero({
  loading,
  todayCheckIn,
  dueExercises,
  nextAppointment,
}: {
  loading?: boolean
  todayCheckIn: TodayCheckIn | null
  dueExercises: DueExercise[]
  nextAppointment?: HomeAppointment | null
}) {
  if (loading) return <Skeleton className="min-h-40 w-full rounded-2xl md:min-h-72 md:rounded-[2.25rem]" />
  if (!todayCheckIn) return <TodayHeroCheckIn />
  if (dueExercises.length > 0) return <TodayHeroExercises exercises={dueExercises} />
  if (nextAppointment) return <TodayHeroAppointment appointment={nextAppointment} />
  return <TodayHeroAllClear />
}

function HeroFrame({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'relative isolate overflow-hidden rounded-2xl p-4 md:rounded-[2.25rem] md:p-6 lg:min-h-80 lg:p-10',
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_0%_0%,rgb(26_167_161/0.32),transparent_58%)]"
        aria-hidden="true"
      />
      {children}
    </section>
  )
}

function TodayHeroCheckIn() {
  return (
    <HeroFrame className="bg-[var(--color-ink)] text-[var(--color-ink-foreground)]">
      <MotionArc className="pointer-events-none absolute -right-16 -bottom-24 hidden w-80 text-[var(--color-primary)] sm:block sm:w-[28rem]" />
      <div className="relative flex h-full min-h-36 flex-col justify-between gap-4 md:min-h-56 md:gap-8">
        <div className="max-w-lg">
          <h2 className="font-display text-xl font-semibold leading-tight tracking-tight text-pretty md:text-[clamp(2rem,4vw,3.25rem)] md:leading-[0.92]">
            {pt.patient.howAmI}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-[var(--color-ink-foreground)]/75 md:mt-4">
            {pt.patient.pendingCheckInHint}
          </p>
        </div>
        <Button asChild className="w-fit">
          <Link to={ROUTES.patient.checkIn}>
            <HeartPulse className="h-4 w-4" aria-hidden="true" />
            {pt.patient.startCheckIn}
          </Link>
        </Button>
      </div>
    </HeroFrame>
  )
}

function TodayHeroExercises({ exercises }: { exercises: DueExercise[] }) {
  return (
    <HeroFrame className="bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
      <MotionArc className="pointer-events-none absolute -right-16 -bottom-16 hidden w-80 opacity-40 sm:block" />
      <div className="relative flex h-full flex-col justify-between gap-4 md:gap-6">
        <div>
          <h2 className="font-display text-xl font-semibold leading-tight tracking-tight md:text-[clamp(2rem,4vw,3.25rem)] md:leading-[0.92]">
            {pt.patient.exercisesDue}
          </h2>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm md:mt-5 md:gap-2 md:text-lg">
            {exercises.slice(0, 4).map((exercise) => (
              <li key={exercise.id}>
                {(exercise.exercise as { title?: string } | null)?.title ?? pt.patient.exercises}
              </li>
            ))}
          </ul>
        </div>
        <Button asChild className="w-fit bg-[var(--color-ink)] text-[var(--color-ink-foreground)] shadow-none hover:bg-[var(--color-card)] hover:text-[var(--color-foreground)]">
          <Link to={ROUTES.patient.exercises}>{pt.patient.seeExercises}</Link>
        </Button>
      </div>
    </HeroFrame>
  )
}

function TodayHeroAppointment({ appointment }: { appointment: HomeAppointment }) {
  return (
    <HeroFrame className="bg-[var(--color-ink)] text-[var(--color-ink-foreground)]">
      <MotionArc className="pointer-events-none absolute -right-16 -bottom-20 hidden w-80 text-[var(--color-primary)] sm:block" />
      <div className="relative flex h-full flex-col justify-between gap-4 md:gap-6">
        <div>
          <h2 className="font-display text-xl font-semibold leading-tight tracking-tight md:text-[clamp(2rem,4vw,3.25rem)] md:leading-[0.92]">
            {pt.patient.nextAppointment}
          </h2>
          <p className="mt-2 font-display text-lg font-semibold tabular-nums md:mt-4 md:text-3xl">
            {formatDateTime(appointment.scheduled_at)}
          </p>
          <p className="mt-1 text-sm text-[var(--color-ink-foreground)]/75">
            {appointment.physiotherapist?.profiles?.full_name}
          </p>
        </div>
        <Button asChild className="w-fit">
          <Link to={ROUTES.patient.appointment(appointment.id)}>{pt.patient.appointments}</Link>
        </Button>
      </div>
    </HeroFrame>
  )
}

function TodayHeroAllClear() {
  return (
    <HeroFrame className="bg-[var(--color-secondary)] text-[var(--color-foreground)]">
      <div className="relative flex min-h-32 flex-col justify-between gap-4 md:min-h-56 md:gap-6">
        <div>
          <CheckCircle2 className="mb-2 h-5 w-5 text-[var(--color-primary)] md:mb-4 md:h-6 md:w-6" aria-hidden="true" />
          <h2 className="font-display text-xl font-semibold leading-tight tracking-tight md:text-[clamp(2rem,4vw,3.25rem)] md:leading-[0.92]">
            {pt.patient.allCaughtUp}
          </h2>
          <p className="mt-2 max-w-md text-sm text-[var(--color-muted-foreground)] md:mt-3">
            {pt.patient.allCaughtUpHint}
          </p>
        </div>
      </div>
    </HeroFrame>
  )
}

function TapeStrip({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <article
      className={cn(
        'flex min-h-28 flex-col justify-between rounded-l-sm rounded-r-2xl border-l-[3px] border-[var(--color-primary)] p-4 md:min-h-40 md:rounded-r-[1.75rem] md:border-l-[6px] md:p-6',
        className
      )}
    >
      {children}
    </article>
  )
}

export function PatientNextVisit({
  appointment,
  loading,
}: {
  appointment?: HomeAppointment | null
  loading?: boolean
}) {
  if (loading) return <Skeleton className="min-h-28 w-full rounded-r-2xl md:min-h-40 md:rounded-r-[1.75rem]" />

  return (
    <TapeStrip className="bg-[var(--color-secondary)]">
      <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted-foreground)] md:text-sm">
        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
        {pt.patient.nextAppointment}
      </div>
      {appointment ? (
        <Link
          to={ROUTES.patient.appointment(appointment.id)}
          className="mt-3 flex items-end justify-between gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] md:mt-4"
        >
          <div className="flex min-w-0 flex-col gap-1">
            <p className="font-display text-base font-semibold md:text-xl">{formatDateTime(appointment.scheduled_at)}</p>
            <p className="truncate text-sm text-[var(--color-muted-foreground)]">
              {appointment.physiotherapist?.profiles?.full_name}
            </p>
            <Badge variant="secondary" className="w-fit bg-[var(--color-card)]">{MODALITY_LABELS[appointment.modality]}</Badge>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" aria-hidden="true" />
        </Link>
      ) : (
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)] md:mt-4">{pt.common.noAppointment}</p>
      )}
    </TapeStrip>
  )
}

export function PatientCareSummary({
  clinicalStatus,
  physioName,
  loading,
}: {
  clinicalStatus?: string
  physioName?: string
  loading?: boolean
}) {
  if (loading) return <Skeleton className="min-h-24 w-full rounded-r-2xl md:min-h-32 md:rounded-r-[1.75rem]" />

  const statusLabel = clinicalStatus ? CLINICAL_STATUS_LABELS[clinicalStatus] ?? clinicalStatus : '—'

  return (
    <TapeStrip className="relative isolate overflow-hidden bg-[var(--color-clay)]">
      <p
        className="pointer-events-none absolute -right-1 bottom-[-0.35em] hidden font-display text-[5rem] leading-none font-semibold text-[var(--color-foreground)]/10 md:block"
        aria-hidden="true"
      >
        {statusLabel}
      </p>
      <p className="relative text-xs font-bold text-[var(--color-muted-foreground)] md:text-sm">{pt.patient.treatmentSummary}</p>
      <p className="relative mt-2 font-display text-lg font-semibold tracking-tight md:mt-3 md:text-2xl">
        {statusLabel}
      </p>
      {physioName && (
        <p className="relative mt-1.5 flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] md:mt-2 md:gap-2">
          <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
          {physioName}
        </p>
      )}
    </TapeStrip>
  )
}

export function PatientProgressCard({
  progress,
  adherence,
  checkIn,
  loading,
}: {
  progress: number
  adherence: number
  checkIn: TodayCheckIn | null
  loading?: boolean
}) {
  if (loading) return <Skeleton className="min-h-28 w-full rounded-2xl md:min-h-40 md:rounded-[2.25rem]" />

  const clamped = Math.min(100, Math.max(0, progress))

  return (
    <article className="relative isolate overflow-hidden rounded-2xl bg-[var(--color-ink)] p-4 text-[var(--color-ink-foreground)] md:rounded-[2.25rem] md:p-6">
      <MotionArc
        className="pointer-events-none absolute -right-10 -bottom-16 hidden w-56 text-[var(--color-primary)] sm:block sm:w-80"
        progress={clamped}
      />
      <div className="relative grid grid-cols-3 gap-3 md:gap-6">
        <div>
          <p className="text-[10px] text-[var(--color-ink-foreground)]/65 md:text-sm">{pt.patient.progress}</p>
          <p className="mt-0.5 font-display text-xl font-semibold tabular-nums md:mt-1 md:text-4xl">{clamped}%</p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--color-ink-foreground)]/65 md:text-sm">{pt.patient.adherence7d}</p>
          <p className="mt-0.5 font-display text-xl font-semibold tabular-nums md:mt-1 md:text-4xl">{adherence}%</p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--color-ink-foreground)]/65 md:text-sm">{pt.patient.painToday}</p>
          <p className="mt-0.5 font-display text-xl font-semibold tabular-nums md:mt-1 md:text-4xl">
            {checkIn ? (checkIn.pain_level ?? '—') : '—'}
          </p>
          {!checkIn && (
            <p className="mt-1 text-[10px] text-[var(--color-warning)] md:text-sm">{pt.patient.pendingCheckInHint}</p>
          )}
        </div>
      </div>
    </article>
  )
}

export function PatientPanel({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl bg-[var(--color-card)] p-4 md:rounded-[1.5rem] md:p-6">
      <div className="mb-3 flex items-center justify-between gap-3 md:mb-4">
        <h2 className="font-display text-base font-semibold md:text-xl">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}
