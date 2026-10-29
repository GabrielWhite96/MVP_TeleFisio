import { describe, it, expect } from 'vitest'
import { loginSchema, signupSchema, subscribeSchema, forgotPasswordSchema, inviteAcceptSchema } from '@/features/auth/model/schemas'

describe('Auth schemas', () => {
  it('validates login form', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: '123456' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email on login', () => {
    const result = loginSchema.safeParse({ email: 'invalid', password: '123456' })
    expect(result.success).toBe(false)
  })

  it('validates public subscribe form without password', () => {
    const result = subscribeSchema.safeParse({
      fullName: 'João Silva',
      email: 'joao@example.com',
    })
    expect(result.success).toBe(true)
  })

  it('rejects subscribe form without a valid email', () => {
    const result = subscribeSchema.safeParse({
      fullName: 'João Silva',
      email: 'invalid',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short password on signup', () => {
    const result = signupSchema.safeParse({
      fullName: 'João',
      email: 'joao@example.com',
      password: '123',
    })
    expect(result.success).toBe(false)
  })

  it('validates patient invite accept form', () => {
    const result = inviteAcceptSchema.safeParse({
      fullName: 'Maria Paciente',
      password: '123456',
    })
    expect(result.success).toBe(true)
  })

  it('validates forgot password form', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'test@example.com' })
    expect(result.success).toBe(true)
  })
})
