import type { ReactElement, ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { PatientReport, ScaleDelta } from '@/features/patient-report/model/build-patient-report'
import { pt } from '@/shared/config/i18n/pt'
import { CLINICAL_STATUS_LABELS, GOAL_METRIC_LABELS } from '@/shared/config/routes'
import { formatDate } from '@/shared/lib/dates'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Label, Textarea } from '@/shared/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'

const copy = pt.report

const PLAN_STATUS: Record<string, string> = {
  active: copy.statusActive,
  completed: copy.statusCompleted,
  paused: copy.statusPaused,
  discharged: copy.statusDischarged,
}

interface PatientReportDocumentProps {
  patientName: string
  dateOfBirth: string | null
  clinicalStatus: string
  physioName: string
  periodLabel: string
  issuedAt: string
  report: PatientReport
  conclusion: string
  onConclusionChange: (value: string) => void
}

function formatBirthDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (match) return `${match[3]}/${match[2]}/${match[1]}`
  return formatDate(value)
}

function Section({
  title,
  hint,
  children,
  className,
}: {
  title: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={cn('report-section', className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {hint ? <CardDescription>{hint}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}

function EmptyLine({ children }: { children: string }) {
  return <p className="text-sm text-[var(--color-muted-foreground)]">{children}</p>
}

function deltaHint(delta: number | null): string | null {
  if (delta == null) return null
  if (delta === 0) return copy.stable
  return delta < 0 ? copy.decreased : copy.increased
}

function formatDelta(scale: ScaleDelta): string {
  if (scale.first == null || scale.last == null) return '—'
  if (scale.delta == null) return String(scale.last)
  const sign = scale.delta > 0 ? `+${scale.delta}` : String(scale.delta)
  return `${scale.first} → ${scale.last} (${sign})`
}

function MetricCard({ title, value, hint }: { title: string; value: string; hint?: string | null }) {
  return (
    <Card className="report-section">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {hint ? <p className="text-sm text-[var(--color-muted-foreground)]">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}

function ChartFrame({ children }: { children: ReactElement }) {
  return (
    <div className="report-chart h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
}

export function PatientReportDocument({
  patientName,
  dateOfBirth,
  clinicalStatus,
  physioName,
  periodLabel,
  issuedAt,
  report,
  conclusion,
  onConclusionChange,
}: PatientReportDocumentProps) {
  const checkInChart = report.checkIns.map((item) => ({
    date: formatDate(item.at),
    Dor: item.pain,
    Mobilidade: item.mobility,
    Confiança: item.confidence,
    Dificuldade: item.difficulty,
  }))
  const vitalChart = report.vitals.map((item) => ({
    date: formatDate(item.at),
    FC: item.hr,
    FR: item.rr,
    SpO2: item.spo2,
    PAs: item.bpSystolic,
    PAd: item.bpDiastolic,
    Temp: item.temperature,
  }))
  const attendanceTotal =
    report.attendance.completed +
    report.attendance.cancelled +
    report.attendance.noShow +
    report.attendance.scheduled
  const attendanceChart = [
    { name: copy.attendanceCompleted, value: report.attendance.completed },
    { name: copy.attendanceCancelled, value: report.attendance.cancelled },
    { name: copy.attendanceNoShow, value: report.attendance.noShow },
    { name: copy.attendanceScheduled, value: report.attendance.scheduled },
  ]
  const statusLabel = CLINICAL_STATUS_LABELS[clinicalStatus] ?? clinicalStatus
  const initial = report.comparison.initial
  const latest = report.comparison.latest

  return (
    <div className="report-document space-y-6">
      <p className="print-page-header hidden text-[var(--color-muted-foreground)]">
        {patientName} · {periodLabel} · {issuedAt}
      </p>

      <div className="report-section space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{patientName}</h1>
          <Badge variant="secondary">{statusLabel}</Badge>
        </div>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {[
            dateOfBirth ? `${copy.dob}: ${formatBirthDate(dateOfBirth)}` : null,
            physioName ? `${copy.physio}: ${physioName}` : null,
            `${copy.periodLabel}: ${periodLabel}`,
            `${copy.issuedAt} ${issuedAt}`,
          ].filter(Boolean).join(' · ')}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{copy.indicators}</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title={copy.sessionsDone} value={String(report.attendance.completed)} />
          <MetricCard title={copy.noShows} value={String(report.attendance.noShow)} />
          <MetricCard title={copy.adherence7} value={report.adherence7 == null ? '—' : `${report.adherence7}%`} />
          <MetricCard title={copy.adherence30} value={report.adherence30 == null ? '—' : `${report.adherence30}%`} />
          <MetricCard title={copy.pain} value={formatDelta(report.pain)} hint={deltaHint(report.pain.delta)} />
          <MetricCard title={copy.mobility} value={formatDelta(report.mobility)} hint={deltaHint(report.mobility.delta)} />
          <MetricCard title={copy.confidence} value={formatDelta(report.confidence)} hint={deltaHint(report.confidence.delta)} />
          <MetricCard
            title={copy.nextEvaluation}
            value={report.nextEvaluationAt ? formatDate(report.nextEvaluationAt) : copy.noNextEvaluation}
          />
        </div>
      </section>

      <Section title={copy.howPatientFeels} hint={copy.howPatientFeelsHint}>
        {!report.checkIns.length && <EmptyLine>{copy.emptyCheckIns}</EmptyLine>}
        {report.checkIns.length === 1 && <EmptyLine>{copy.needTwoPoints}</EmptyLine>}
        {report.checkIns.length >= 2 && (
          <ChartFrame>
            <LineChart data={checkInChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Dor" stroke="#be123c" connectNulls />
              <Line type="monotone" dataKey="Mobilidade" stroke="#0f766e" connectNulls />
              <Line type="monotone" dataKey="Confiança" stroke="#0369a1" connectNulls />
              <Line type="monotone" dataKey="Dificuldade" stroke="#b45309" connectNulls />
            </LineChart>
          </ChartFrame>
        )}
        {report.checkIns.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{copy.date}</TableHead>
                <TableHead>{copy.pain}</TableHead>
                <TableHead>{copy.mobility}</TableHead>
                <TableHead>{copy.confidence}</TableHead>
                <TableHead>{copy.difficulty}</TableHead>
                <TableHead>{copy.notes}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...report.checkIns].reverse().map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{formatDate(item.at)}</TableCell>
                  <TableCell>{item.pain ?? '—'}</TableCell>
                  <TableCell>{item.mobility ?? '—'}</TableCell>
                  <TableCell>{item.confidence ?? '—'}</TableCell>
                  <TableCell>{item.difficulty ?? '—'}</TableCell>
                  <TableCell>{item.notes || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      <Section title={copy.vitals} hint={copy.vitalsHint}>
        {!report.vitals.length && <EmptyLine>{copy.emptyVitals}</EmptyLine>}
        {report.vitals.length === 1 && <EmptyLine>{copy.needTwoPoints}</EmptyLine>}
        {report.vitals.length >= 2 && (
          <ChartFrame>
            <LineChart data={vitalChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="FC" stroke="#0f766e" connectNulls />
              <Line type="monotone" dataKey="FR" stroke="#0369a1" connectNulls />
              <Line type="monotone" dataKey="SpO2" stroke="#7c3aed" connectNulls />
              <Line type="monotone" dataKey="PAs" stroke="#b45309" connectNulls />
              <Line type="monotone" dataKey="PAd" stroke="#be123c" connectNulls />
              <Line type="monotone" dataKey="Temp" stroke="#15803d" connectNulls />
            </LineChart>
          </ChartFrame>
        )}
      </Section>

      <Section title={copy.assessments} hint={copy.assessmentsHint}>
        {!initial && !latest && <EmptyLine>{copy.emptyAssessments}</EmptyLine>}
        {(initial || latest) && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{copy.exam}</TableHead>
                <TableHead>
                  {copy.initial}
                  {initial ? ` · ${formatDate(initial.at)}` : ''}
                </TableHead>
                <TableHead>
                  {copy.latest}
                  {latest ? ` · ${formatDate(latest.at)}` : ''}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">{copy.chiefComplaint}</TableCell>
                <TableCell>{initial?.chiefComplaint || '—'}</TableCell>
                <TableCell>{latest?.chiefComplaint || (initial ? copy.noReassessment : '—')}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">{copy.shortTermGoal}</TableCell>
                <TableCell>{initial?.shortTermGoal || '—'}</TableCell>
                <TableCell>{latest?.shortTermGoal || '—'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">{copy.longTermGoal}</TableCell>
                <TableCell>{initial?.longTermGoal || '—'}</TableCell>
                <TableCell>{latest?.longTermGoal || '—'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">{copy.deficits}</TableCell>
                <TableCell>{initial?.deficits.length ? initial.deficits.join('; ') : copy.noDeficits}</TableCell>
                <TableCell>{latest ? (latest.deficits.length ? latest.deficits.join('; ') : copy.noDeficits) : '—'}</TableCell>
              </TableRow>
              {report.comparison.examRows.map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="font-medium">{row.label}</TableCell>
                  <TableCell>{row.initial}</TableCell>
                  <TableCell>{row.latest}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      <Section title={copy.plan}>
        {!report.plan && <EmptyLine>{copy.emptyPlan}</EmptyLine>}
        {report.plan && (
          <>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p><span className="font-medium">{copy.condition}: </span>{report.plan.condition || '—'}</p>
              <p><span className="font-medium">{copy.status}: </span>{PLAN_STATUS[report.plan.status] ?? report.plan.status}</p>
              <p><span className="font-medium">{copy.primaryGoal}: </span>{report.plan.primaryGoal}</p>
              <p><span className="font-medium">{copy.frequency}: </span>{report.plan.frequency}</p>
              <p><span className="font-medium">{copy.duration}: </span>{report.plan.durationWeeks} {copy.weeks}</p>
            </div>
            {report.plan.goals.length > 0 && (
              <div className="space-y-3">
                {report.plan.goals.map((goal) => (
                  <div key={goal.title} className="space-y-1">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium">{goal.title}</span>
                      <span className="text-[var(--color-muted-foreground)]">
                        {GOAL_METRIC_LABELS[goal.metricType] ?? goal.metricType}
                        {' · '}
                        {goal.current ?? '—'} / {goal.target ?? '—'} {goal.unit ?? ''}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--color-muted)]">
                      <div
                        className="h-full rounded-full bg-[var(--color-primary)]"
                        style={{ width: `${goal.percent ?? 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Section>

      <Section title={copy.sessions}>
        {!attendanceTotal && <EmptyLine>{copy.emptyAppointments}</EmptyLine>}
        {attendanceTotal > 0 && (
          <>
            <h3 className="text-sm font-medium">{copy.attendance}</h3>
            <ChartFrame>
              <BarChart data={attendanceChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name={copy.sessions} fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartFrame>
          </>
        )}
        <h3 className="text-sm font-medium">{copy.evolutions}</h3>
        {!report.evolutions.length && <EmptyLine>{copy.emptyEvolutions}</EmptyLine>}
        {report.evolutions.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{copy.date}</TableHead>
                <TableHead>{copy.vitals}</TableHead>
                <TableHead>{copy.conducts}</TableHead>
                <TableHead>{copy.observations}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.evolutions.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-nowrap">{formatDate(item.at)}</TableCell>
                  <TableCell>{item.vitals || '—'}</TableCell>
                  <TableCell className="max-w-xs whitespace-pre-wrap">{item.conducts || '—'}</TableCell>
                  <TableCell className="max-w-xs whitespace-pre-wrap">{item.observations || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      <Section title={copy.exercises}>
        {!report.exercises.length && <EmptyLine>{copy.emptyExercises}</EmptyLine>}
        {report.exercises.length > 0 && !report.weeklyCompletions.length && (
          <EmptyLine>{copy.emptyCompletions}</EmptyLine>
        )}
        {report.weeklyCompletions.length > 0 && (
          <ChartFrame>
            <BarChart data={report.weeklyCompletions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name={copy.completions} fill="#0369a1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartFrame>
        )}
        {report.exercises.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{copy.exercise}</TableHead>
                <TableHead>{copy.sets}</TableHead>
                <TableHead>{copy.reps}</TableHead>
                <TableHead>{copy.frequency}</TableHead>
                <TableHead>{copy.completions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.exercises.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>{item.sets ?? '—'}</TableCell>
                  <TableCell>{item.reps ?? '—'}</TableCell>
                  <TableCell>{item.frequency || '—'}</TableCell>
                  <TableCell>{item.completions}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      <Card className={cn('report-section', !conclusion.trim() && 'print:hidden')}>
        <CardHeader>
          <CardTitle className="text-base">{copy.conclusion}</CardTitle>
          <CardDescription className="no-print">{copy.conclusionHint}</CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="report-conclusion" className="no-print sr-only">{copy.conclusion}</Label>
          <Textarea
            id="report-conclusion"
            className="no-print min-h-28"
            value={conclusion}
            placeholder={copy.conclusionPlaceholder}
            onChange={(event) => onConclusionChange(event.target.value)}
          />
          {conclusion.trim() ? (
            <p className="report-conclusion-print whitespace-pre-wrap">{conclusion.trim()}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
