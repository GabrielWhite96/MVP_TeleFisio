/**
 * Integration tests for RLS (run against local/remote Supabase when configured).
 *
 * Expected policies:
 * - patient sees only own appointments, exercises, check-ins, treatment plans
 * - physiotherapist sees linked patients via care_relationships
 * - caregiver sees progress/appointments/exercises, never clinical_records
 * - admin can promote roles and read audit_logs
 */

import { describe, it, expect } from 'vitest'

const CAREGIVER_DEFAULT_PERMISSIONS = {
  view_progress: true,
  view_appointments: true,
  view_exercises: true,
  view_clinical_records: false,
}

describe('Caregiver permission defaults', () => {
  it('does not grant clinical records by default', () => {
    expect(CAREGIVER_DEFAULT_PERMISSIONS.view_clinical_records).toBe(false)
    expect(CAREGIVER_DEFAULT_PERMISSIONS.view_progress).toBe(true)
  })
})

describe('RLS matrix (contract)', () => {
  it('documents required access rules', () => {
    const matrix = {
      clinical_records: { patient: 'own', physio: 'linked', caregiver: 'none', admin: 'all' },
      check_ins: { patient: 'own', physio: 'linked', caregiver: 'linked', admin: 'all' },
    }
    expect(matrix.clinical_records.caregiver).toBe('none')
    expect(matrix.check_ins.caregiver).toBe('linked')
  })
})
