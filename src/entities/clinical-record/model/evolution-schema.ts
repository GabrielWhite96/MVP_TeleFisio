import type { VitalSigns } from './vital-signs'

export interface EvolutionActivity {
  done: boolean
  notes: string
  /** Future catalog selections from clinical-options.ts */
  items: string[]
}

export interface EvolutionStructuredData {
  vitals: VitalSigns
  performed: EvolutionActivity
  exercises: EvolutionActivity
  training: EvolutionActivity
  strengthening: EvolutionActivity
  changes: EvolutionActivity
  conduct: EvolutionActivity
  observations: string
}
