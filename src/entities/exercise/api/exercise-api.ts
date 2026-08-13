import { supabase } from '@/shared/api/supabase'

export async function getExerciseLibrary() {
  const { data, error } = await supabase
    .from('exercise_library')
    .select('*')
    .order('title')
  if (error) throw error
  return data
}

export async function getPatientExercises(patientId: string) {
  const { data, error } = await supabase
    .from('patient_exercises')
    .select(`
      *,
      exercise:exercise_library(*),
      completions:exercise_completions(*)
    `)
    .eq('patient_id', patientId)
    .eq('active', true)
    .order('assigned_at', { ascending: false })
  if (error) throw error
  return data
}

export async function assignExercise(input: {
  patientId: string
  physiotherapistId: string
  exerciseId: string
  sets?: number
  reps?: number
  frequency?: string
  notes?: string
}) {
  const { data, error } = await supabase
    .from('patient_exercises')
    .insert({
      patient_id: input.patientId,
      physiotherapist_id: input.physiotherapistId,
      exercise_id: input.exerciseId,
      sets: input.sets ?? 3,
      reps: input.reps ?? 10,
      frequency: input.frequency ?? 'daily',
      notes: input.notes ?? null,
    })
    .select()
    .single()
  if (error) throw error

  await supabase.rpc('log_audit_event', {
    p_action: 'EXERCISE_ASSIGNED',
    p_entity_type: 'patient_exercises',
    p_entity_id: data.id,
  })

  return data
}

export type ExerciseDifficultyRating = 'easy' | 'moderate' | 'hard'

export async function completeExercise(
  patientExerciseId: string,
  notes?: string,
  difficultyRating?: ExerciseDifficultyRating
) {
  const { data, error } = await supabase
    .from('exercise_completions')
    .insert({
      patient_exercise_id: patientExerciseId,
      notes: notes ?? null,
      difficulty_rating: difficultyRating ?? null,
    } as Record<string, unknown>)
    .select()
    .single()
  if (error) throw error

  await supabase.rpc('log_audit_event', {
    p_action: 'EXERCISE_COMPLETED',
    p_entity_type: 'exercise_completions',
    p_entity_id: data.id,
  })

  return data
}

export async function createExercise(input: {
  title: string
  description?: string
  instructions?: string
  createdBy: string
}) {
  const { data, error } = await supabase
    .from('exercise_library')
    .insert({
      title: input.title,
      description: input.description ?? null,
      instructions: input.instructions ?? null,
      created_by: input.createdBy,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export function calculateExerciseProgress(
  exercises: Array<{ completions?: Array<{ id: string }> }>
): number {
  if (exercises.length === 0) return 0
  const withCompletions = exercises.filter((e) => (e.completions?.length ?? 0) > 0).length
  return Math.round((withCompletions / exercises.length) * 100)
}
