import { describe, it, expect } from 'vitest'
import { loginSchema, signupSchema, forgotPasswordSchema } from '@/features/auth/model/schemas'

describe('Auth schemas', () => {
  it('validates login form', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: '123456' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email on login', () => {
    const result = loginSchema.safeParse({ email: 'invalid', password: '123456' })
    expect(result.success).toBe(false)
  })

  it('validates signup form', () => {
    const result = signupSchema.safeParse({
      fullName: 'João Silva',
      email: 'joao@example.com',
      password: '123456',
      role: 'patient',
    })
    expect(result.success).toBe(true)
  })

  it('rejects short password on signup', () => {
    const result = signupSchema.safeParse({
      fullName: 'João',
      email: 'joao@example.com',
      password: '123',
      role: 'patient',
    })
    expect(result.success).toBe(false)
  })

  it('validates forgot password form', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'test@example.com' })
    expect(result.success).toBe(true)
  })
})
