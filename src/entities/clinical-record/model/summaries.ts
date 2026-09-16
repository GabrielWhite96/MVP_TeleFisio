import type { AssessmentStructuredData, ExamFinding } from './assessment-schema'
import type { EvolutionStructuredData } from './evolution-schema'
import type { VitalSigns } from './vital-signs'
import { EXAM_STATUS_OPTIONS } from './exam-status'

function statusLabel(status: ExamFinding['status']) {
  return EXAM_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status
}

function formatVitals(v: VitalSigns): string {
  const parts: string[] = []
  if (v.hr != null) parts.push(`FC ${v.hr}`)
  if (v.rr != null) parts.push(`FR ${v.rr}`)
  if (v.spo2 != null) parts.push(`SpO2 ${v.spo2}%`)
  if (v.bpSystolic != null || v.bpDiastolic != null) {
    parts.push(`PA ${v.bpSystolic ?? '—'}/${v.bpDiastolic ?? '—'}`)
  }
  if (v.temperature != null) parts.push(`Temp ${v.temperature}°C`)
  return parts.join(', ')
}

function findingLine(label: string, f: ExamFinding): string | null {
  if (f.status === 'nao_avaliado' && !f.notes) return null
  const base = `${label}: ${statusLabel(f.status)}`
  return f.notes ? `${base} — ${f.notes}` : base
}

/** Build legacy TEXT `assessment` from structured assessment/reassessment. */
export function summarizeAssessment(data: AssessmentStructuredData): string {
  const lines: string[] = []
  const { anamnese, physicalExam, findings, therapeuticPlan } = data

  if (anamnese.chiefComplaint) lines.push(`Queixa: ${anamnese.chiefComplaint}`)
  if (anamnese.currentIllnessHistory) lines.push(`HDA: ${anamnese.currentIllnessHistory}`)
  if (anamnese.pastMedicalHistory) lines.push(`HPP: ${anamnese.pastMedicalHistory}`)
  if (anamnese.medications) lines.push(`Medicações: ${anamnese.medications}`)
  if (anamnese.previousSurgeries) lines.push(`Cirurgias: ${anamnese.previousSurgeries}`)

  const vitals = formatVitals(physicalExam.vitals)
  if (vitals) lines.push(`Sinais vitais: ${vitals}`)

  const examKeys: Array<[string, ExamFinding]> = [
    ['Ausculta', physicalExam.ausculta],
    ['MRC', physicalExam.mrc],
    ['Goniometria', physicalExam.goniometria],
    ['Postura', physicalExam.posturalChanges],
    ['Marcha', physicalExam.gaitChanges],
    ['Reflexos superficiais', physicalExam.superficialReflexes],
    ['Reflexos profundos', physicalExam.deepReflexes],
    ['Equilíbrio estático', physicalExam.staticBalance],
    ['Equilíbrio dinâmico', physicalExam.dynamicBalance],
    ['Testes especiais', physicalExam.specialTests],
  ]
  for (const [label, finding] of examKeys) {
    const line = findingLine(label, finding)
    if (line) lines.push(line)
  }

  const yesNo = (label: string, y: { yes: boolean | null; detail: string }) => {
    if (y.yes === null) return
    const ans = y.yes ? `Sim${y.detail ? ` — ${y.detail}` : ''}` : 'Não'
    lines.push(`${label}: ${ans}`)
  }
  yesNo('Encurtamentos/deformidades', findings.shorteningsDeformities)
  yesNo('Perda de força', findings.muscleStrengthLoss)
  yesNo('Perda de mobilidade', findings.mobilityLoss)

  if (therapeuticPlan.shortTermGoal) lines.push(`Meta curto prazo: ${therapeuticPlan.shortTermGoal}`)
  if (therapeuticPlan.longTermGoal) lines.push(`Meta longo prazo: ${therapeuticPlan.longTermGoal}`)

  return lines.join('\n')
}

/** Build legacy TEXT `evolution` from structured evolution. */
export function summarizeEvolution(data: EvolutionStructuredData): string {
  const lines: string[] = []
  const vitals = formatVitals(data.vitals)
  if (vitals) lines.push(`Sinais vitais: ${vitals}`)

  const acts: Array<[string, { done: boolean; notes: string; items?: string[] }]> = [
    ['Realizado', data.performed],
    ['Exercícios', data.exercises],
    ['Treinos', data.training],
    ['Fortalecimento', data.strengthening],
    ['Alterações', data.changes],
    ['Conduta', data.conduct],
  ]
  for (const [label, act] of acts) {
    if (!act.done && !act.notes && !(act.items?.length)) continue
    const extras = [act.items?.length ? act.items.join(', ') : '', act.notes].filter(Boolean).join(' — ')
    lines.push(`${label}: ${act.done ? 'Sim' : 'Não'}${extras ? ` — ${extras}` : ''}`)
  }
  if (data.observations) lines.push(`Observações: ${data.observations}`)
  return lines.join('\n')
}

/** Build legacy TEXT `treatment_plan` from assessment therapeutic plan. */
export function summarizeTreatmentPlan(data: AssessmentStructuredData): string {
  const { shortTermGoal, longTermGoal } = data.therapeuticPlan
  const lines: string[] = []
  if (shortTermGoal) lines.push(`Curto prazo: ${shortTermGoal}`)
  if (longTermGoal) lines.push(`Longo prazo: ${longTermGoal}`)
  return lines.join('\n')
}

export function extractDeficitSummary(data: AssessmentStructuredData): string[] {
  const deficits: string[] = []
  const { findings } = data
  if (findings.shorteningsDeformities.yes) {
    deficits.push(
      findings.shorteningsDeformities.detail
        ? `Encurtamentos/deformidades: ${findings.shorteningsDeformities.detail}`
        : 'Encurtamentos/deformidades'
    )
  }
  if (findings.muscleStrengthLoss.yes) {
    deficits.push(
      findings.muscleStrengthLoss.detail
        ? `Perda de força: ${findings.muscleStrengthLoss.detail}`
        : 'Perda de força muscular'
    )
  }
  if (findings.mobilityLoss.yes) {
    deficits.push(
      findings.mobilityLoss.detail
        ? `Perda de mobilidade: ${findings.mobilityLoss.detail}`
        : 'Perda de mobilidade'
    )
  }
  return deficits
}
