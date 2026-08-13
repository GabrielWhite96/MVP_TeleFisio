import { z } from 'zod'

export const bookingSchema = z.object({
  modality: z.enum(['telehealth', 'home_visit']),
  physiotherapistId: z.string().uuid('Selecione um fisioterapeuta'),
  date: z.date({ required_error: 'Selecione uma data' }),
  time: z.string().min(1, 'Selecione um horário'),
  notes: z.string().optional(),
})

export type BookingFormData = z.infer<typeof bookingSchema>
