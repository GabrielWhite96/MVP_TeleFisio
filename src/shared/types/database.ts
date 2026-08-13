export type UserRole = 'patient' | 'physiotherapist' | 'admin' | 'caregiver'
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
export type AppointmentModality = 'telehealth' | 'home_visit'
export type NotificationType = 'appointment_reminder' | 'appointment_confirmed' | 'appointment_cancelled' | 'exercise_assigned' | 'general'
export type AuditAction = 'LOGIN' | 'PATIENT_CREATED' | 'PHYSIOTHERAPIST_CREATED' | 'APPOINTMENT_CREATED' | 'APPOINTMENT_CANCELLED' | 'APPOINTMENT_COMPLETED' | 'CLINICAL_RECORD_CREATED' | 'CLINICAL_RECORD_UPDATED' | 'EXERCISE_ASSIGNED' | 'EXERCISE_COMPLETED'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: UserRole
          full_name: string
          phone: string | null
          avatar_url: string | null
          timezone: string
          organization_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: UserRole
          full_name: string
          phone?: string | null
          avatar_url?: string | null
          timezone?: string
          organization_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      patients: {
        Row: {
          id: string
          profile_id: string
          date_of_birth: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          province: string | null
          postal_code: string | null
          organization_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          profile_id: string
          date_of_birth?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          province?: string | null
          postal_code?: string | null
          organization_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['patients']['Insert']>
      }
      physiotherapists: {
        Row: {
          id: string
          profile_id: string
          license_number: string | null
          province: string | null
          specialties: string[]
          experience_years: number | null
          modalities: AppointmentModality[]
          service_cities: string[]
          bio: string | null
          organization_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          profile_id: string
          license_number?: string | null
          province?: string | null
          specialties?: string[]
          experience_years?: number | null
          modalities?: AppointmentModality[]
          service_cities?: string[]
          bio?: string | null
          organization_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['physiotherapists']['Insert']>
      }
      appointments: {
        Row: {
          id: string
          patient_id: string
          physiotherapist_id: string
          modality: AppointmentModality
          status: AppointmentStatus
          scheduled_at: string
          duration_minutes: number
          home_address: string | null
          notes: string | null
          price_cents: number | null
          insurance_id: string | null
          recurrence_rule: string | null
          organization_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          patient_id: string
          physiotherapist_id: string
          modality: AppointmentModality
          status?: AppointmentStatus
          scheduled_at: string
          duration_minutes?: number
          home_address?: string | null
          notes?: string | null
          price_cents?: number | null
          insurance_id?: string | null
          recurrence_rule?: string | null
          organization_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['appointments']['Insert']> & { status?: AppointmentStatus }
      }
      availability: {
        Row: {
          id: string
          physiotherapist_id: string
          day_of_week: number
          start_time: string
          end_time: string
          modality: AppointmentModality
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          physiotherapist_id: string
          day_of_week: number
          start_time: string
          end_time: string
          modality: AppointmentModality
          is_active?: boolean
        }
        Update: Partial<Database['public']['Tables']['availability']['Insert']>
      }
      clinical_records: {
        Row: {
          id: string
          appointment_id: string | null
          physiotherapist_id: string
          patient_id: string
          assessment: string | null
          observations: string | null
          evolution: string | null
          treatment_plan: string | null
          recommendations: string | null
          next_evaluation_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          physiotherapist_id: string
          patient_id: string
          assessment?: string | null
          observations?: string | null
          evolution?: string | null
          treatment_plan?: string | null
          recommendations?: string | null
          next_evaluation_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['clinical_records']['Insert']>
      }
      exercise_library: {
        Row: {
          id: string
          created_by: string | null
          title: string
          description: string | null
          instructions: string | null
          video_url: string | null
          difficulty: string | null
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          created_by?: string | null
          title: string
          description?: string | null
          instructions?: string | null
          video_url?: string | null
          difficulty?: string | null
          tags?: string[]
        }
        Update: Partial<Database['public']['Tables']['exercise_library']['Insert']>
      }
      patient_exercises: {
        Row: {
          id: string
          patient_id: string
          physiotherapist_id: string
          exercise_id: string
          sets: number
          reps: number
          frequency: string
          notes: string | null
          assigned_at: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          patient_id: string
          physiotherapist_id: string
          exercise_id: string
          sets?: number
          reps?: number
          frequency?: string
          notes?: string | null
          active?: boolean
        }
        Update: Partial<Database['public']['Tables']['patient_exercises']['Insert']>
      }
      exercise_completions: {
        Row: {
          id: string
          patient_exercise_id: string
          completed_at: string
          notes: string | null
          created_at: string
        }
        Insert: {
          patient_exercise_id: string
          completed_at?: string
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['exercise_completions']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: NotificationType
          title: string
          body: string
          read_at: string | null
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: {
          user_id: string
          type?: NotificationType
          title: string
          body: string
          read_at?: string | null
          metadata?: Record<string, unknown>
        }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
      care_relationships: {
        Row: {
          id: string
          patient_id: string
          physiotherapist_id: string
          started_at: string
          ended_at: string | null
          created_at: string
          updated_at: string
        }
      }
    }
    Functions: {
      log_audit_event: {
        Args: {
          p_action: AuditAction
          p_entity_type: string
          p_entity_id?: string
          p_metadata?: Record<string, unknown>
        }
        Returns: string
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Patient = Database['public']['Tables']['patients']['Row']
export type Physiotherapist = Database['public']['Tables']['physiotherapists']['Row']
export type Appointment = Database['public']['Tables']['appointments']['Row']
export type Availability = Database['public']['Tables']['availability']['Row']
export type ClinicalRecord = Database['public']['Tables']['clinical_records']['Row']
export type ExerciseLibrary = Database['public']['Tables']['exercise_library']['Row']
export type PatientExercise = Database['public']['Tables']['patient_exercises']['Row']
export type ExerciseCompletion = Database['public']['Tables']['exercise_completions']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
