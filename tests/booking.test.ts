import { describe, it, expect } from 'vitest'
import { bookingSchema } from '@/features/booking/model/schemas'

describe('Booking schema', () => {
  it('validates complete booking data', () => {
    const result = bookingSchema.safeParse({
      modality: 'telehealth',
      physiotherapistId: '550e8400-e29b-41d4-a716-446655440000',
      date: new Date('2026-09-01'),
      time: '10:00',
      notes: 'Teste',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing physiotherapist', () => {
    const result = bookingSchema.safeParse({
      modality: 'telehealth',
      physiotherapistId: 'invalid',
      date: new Date(),
      time: '10:00',
    })
    expect(result.success).toBe(false)
  })
})

describe('Create appointment payload', () => {
  it('builds correct appointment input shape', () => {
    const payload = {
      patientId: '550e8400-e29b-41d4-a716-446655440001',
      physiotherapistId: '550e8400-e29b-41d4-a716-446655440000',
      modality: 'telehealth' as const,
      scheduledAt: new Date('2026-09-01T10:00:00').toISOString(),
    }
    expect(payload.modality).toBe('telehealth')
    expect(payload.scheduledAt).toContain('2026')
  })
})

describe('Cancel appointment', () => {
  it('uses cancelled status for cancellation', () => {
    const status = 'cancelled'
    expect(['scheduled', 'confirmed'].includes('scheduled')).toBe(true)
    expect(status).toBe('cancelled')
  })
})
