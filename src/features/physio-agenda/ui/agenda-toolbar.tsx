import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { ROUTES } from '@/shared/config/routes'
import { pt } from '@/shared/config/i18n/pt'
import type { AgendaView } from '@/features/physio-agenda/model/agenda-utils'
import { rangeLabel } from '@/features/physio-agenda/model/agenda-utils'
import { GoogleCalendarConnectButton } from '@/features/physio-agenda/ui/google-calendar-connect'

export function AgendaToolbar({
  view,
  onViewChange,
  anchor,
  onToday,
  onPrev,
  onNext,
  physiotherapistId,
}: {
  view: AgendaView
  onViewChange: (view: AgendaView) => void
  anchor: Date
  onToday: () => void
  onPrev: () => void
  onNext: () => void
  physiotherapistId: string
}) {
  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <div className="flex flex-wrap items-start justify-between gap-2 md:gap-3">
        <div>
          <h1 className="page-title">{pt.physio.agenda}</h1>
          <p className="page-kicker">{pt.agenda.subtitle}</p>
        </div>
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
          {physiotherapistId ? (
            <GoogleCalendarConnectButton physiotherapistId={physiotherapistId} />
          ) : null}
          <Button asChild size="sm" className="md:h-10 md:px-5 md:text-sm">
            <Link to={ROUTES.physio.appointmentNew}>
              <Plus className="mr-1.5 h-4 w-4" />
              {pt.physio.newAppointment}
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
        <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
          <Button variant="outline" size="sm" onClick={onToday}>
            {pt.agenda.today}
          </Button>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              data-compact
              className="size-9 min-h-9 min-w-9"
              onClick={onPrev}
              aria-label={pt.agenda.previous}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              data-compact
              className="size-9 min-h-9 min-w-9"
              onClick={onNext}
              aria-label={pt.agenda.next}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="min-w-0 text-sm font-medium capitalize">
            {rangeLabel(anchor, view)}
          </p>
        </div>

        <Tabs value={view} onValueChange={(v) => onViewChange(v as AgendaView)}>
          <TabsList className="w-full justify-between sm:w-auto">
            <TabsTrigger value="day">{pt.agenda.viewDay}</TabsTrigger>
            <TabsTrigger value="week">{pt.agenda.viewWeek}</TabsTrigger>
            <TabsTrigger value="month">{pt.agenda.viewMonth}</TabsTrigger>
            <TabsTrigger value="list">{pt.agenda.viewList}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  )
}
