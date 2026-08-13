import { format, parseISO, addMinutes, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatDate(date: string | Date, pattern = 'dd/MM/yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, pattern, { locale: ptBR })
}

export function formatDateTime(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function formatTime(time: string) {
  return time.slice(0, 5)
}

export function generateTimeSlots(
  startTime: string,
  endTime: string,
  intervalMinutes = 60,
  existingSlots: string[] = []
): string[] {
  const slots: string[] = []
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  let current = startH * 60 + startM
  const end = endH * 60 + endM

  while (current + intervalMinutes <= end) {
    const h = Math.floor(current / 60).toString().padStart(2, '0')
    const m = (current % 60).toString().padStart(2, '0')
    const slot = `${h}:${m}`
    if (!existingSlots.includes(slot)) {
      slots.push(slot)
    }
    current += intervalMinutes
  }
  return slots
}

export function combineDateAndTime(date: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number)
  const result = new Date(date)
  result.setHours(h, m, 0, 0)
  return result
}

export function isUpcoming(date: string) {
  return isAfter(parseISO(date), new Date())
}

export function isToday(date: string) {
  const d = parseISO(date)
  const now = new Date()
  return isAfter(d, startOfDay(now)) && isBefore(d, endOfDay(now))
}

export function getDayName(dayOfWeek: number): string {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  return days[dayOfWeek] ?? ''
}

export function addDuration(date: string, minutes: number) {
  return addMinutes(parseISO(date), minutes).toISOString()
}
