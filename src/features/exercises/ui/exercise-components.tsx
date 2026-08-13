import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getExerciseLibrary,
  getPatientExercises,
  assignExercise,
  completeExercise,
  type ExerciseDifficultyRating,
} from '@/entities/exercise/api/exercise-api'
import { queryKeys } from '@/shared/api/query-keys'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input, Label } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Badge } from '@/shared/ui/badge'
import { EmptyState, LoadingSpinner } from '@/shared/ui/states'
import { CheckCircle2 } from 'lucide-react'
import { DIFFICULTY_LABELS } from '@/shared/config/routes'
import { pt } from '@/shared/config/i18n/pt'

interface AssignExerciseFormProps {
  patientId: string
  physiotherapistId: string
}

export function AssignExerciseForm({ patientId, physiotherapistId }: AssignExerciseFormProps) {
  const queryClient = useQueryClient()
  const [exerciseId, setExerciseId] = useState('')
  const [sets, setSets] = useState(3)
  const [reps, setReps] = useState(10)
  const [frequency, setFrequency] = useState('daily')

  const libraryQuery = useQuery({
    queryKey: queryKeys.exerciseLibrary,
    queryFn: getExerciseLibrary,
  })

  const mutation = useMutation({
    mutationFn: () =>
      assignExercise({ patientId, physiotherapistId, exerciseId, sets, reps, frequency }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patientExercises(patientId) })
      setExerciseId('')
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prescrever exercício</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Exercício</Label>
          <Select value={exerciseId} onValueChange={setExerciseId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um exercício" />
            </SelectTrigger>
            <SelectContent>
              {libraryQuery.data?.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Séries</Label>
            <Input type="number" value={sets} onChange={(e) => setSets(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Repetições</Label>
            <Input type="number" value={reps} onChange={(e) => setReps(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Frequência</Label>
            <Input value={frequency} onChange={(e) => setFrequency(e.target.value)} />
          </div>
        </div>
        <Button onClick={() => mutation.mutate()} disabled={!exerciseId || mutation.isPending}>
          Prescrever
        </Button>
      </CardContent>
    </Card>
  )
}

const DIFFICULTY_OPTIONS: ExerciseDifficultyRating[] = ['easy', 'moderate', 'hard']

export function PatientExerciseList({ patientId, canComplete = false }: { patientId: string; canComplete?: boolean }) {
  const queryClient = useQueryClient()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<ExerciseDifficultyRating | null>(null)

  const query = useQuery({
    queryKey: queryKeys.patientExercises(patientId),
    queryFn: () => getPatientExercises(patientId),
  })

  const completeMutation = useMutation({
    mutationFn: ({ id, rating }: { id: string; rating: ExerciseDifficultyRating }) =>
      completeExercise(id, undefined, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patientExercises(patientId) })
      setPendingId(null)
      setDifficulty(null)
    },
  })

  if (query.isLoading) return <LoadingSpinner />
  if (!query.data?.length) {
    return <EmptyState title="Nenhum exercício prescrito" description="Seu fisioterapeuta ainda não atribuiu exercícios." />
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {query.data.map((pe) => {
        const exercise = pe.exercise as { title: string; description: string | null; instructions: string | null } | null
        const completions = pe.completions as Array<{ id: string; completed_at: string }> | null
        const doneToday = completions?.some((c) => {
          const d = new Date(c.completed_at)
          const today = new Date()
          return d.toDateString() === today.toDateString()
        })
        const isPending = pendingId === pe.id

        return (
          <Card key={pe.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{exercise?.title}</CardTitle>
                {doneToday && <Badge variant="success">{pt.exercise.doneToday}</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {exercise?.description && (
                <p className="text-sm text-[var(--color-muted-foreground)]">{exercise.description}</p>
              )}
              <p className="text-sm">
                {pe.sets}x{pe.reps} · {pe.frequency}
              </p>
              {exercise?.instructions && (
                <p className="text-xs text-[var(--color-muted-foreground)]">{exercise.instructions}</p>
              )}
              {canComplete && !doneToday && !isPending && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => { setPendingId(pe.id); setDifficulty(null) }}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {pt.exercise.markDone}
                </Button>
              )}
              {canComplete && !doneToday && isPending && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{pt.exercise.difficulty}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {DIFFICULTY_OPTIONS.map((option) => (
                      <Button
                        key={option}
                        type="button"
                        size="sm"
                        variant={difficulty === option ? 'default' : 'outline'}
                        onClick={() => setDifficulty(option)}
                      >
                        {DIFFICULTY_LABELS[option]}
                      </Button>
                    ))}
                  </div>
                  <Button
                    className="w-full"
                    disabled={!difficulty || completeMutation.isPending}
                    onClick={() => difficulty && completeMutation.mutate({ id: pe.id, rating: difficulty })}
                  >
                    {completeMutation.isPending ? pt.common.loading : pt.common.confirm}
                  </Button>
                </div>
              )}
              {(completions?.length ?? 0) > 0 && (
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {completions!.length} conclusão(ões)
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
