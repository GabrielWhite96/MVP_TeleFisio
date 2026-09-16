export const ROUTES = {
  home: '/',
  login: '/auth/login',
  signup: '/auth/signup',
  forgotPassword: '/auth/forgot-password',
  invite: (token: string) => `/auth/invite/${token}`,
  patient: {
    dashboard: '/patient/dashboard',
    profile: '/patient/profile',
    appointments: '/patient/appointments',
    appointment: (id: string) => `/patient/appointments/${id}`,
    exercises: '/patient/exercises',
    checkIn: '/patient/check-in',
    notifications: '/patient/notifications',
    caregivers: '/patient/caregivers',
  },
  physio: {
    dashboard: '/physio/dashboard',
    agenda: '/physio/agenda',
    patients: '/physio/patients',
    patient: (id: string) => `/physio/patients/${id}`,
    patientNew: '/physio/patients/new',
    appointment: (id: string) => `/physio/appointments/${id}`,
    appointmentNew: '/physio/appointments/new',
    profile: '/physio/profile',
  },
  caregiver: {
    dashboard: '/caregiver/dashboard',
  },
  admin: {
    dashboard: '/admin/dashboard',
    users: '/admin/users',
    appointments: '/admin/appointments',
    auditLogs: '/admin/audit-logs',
  },
} as const

export const CANADIAN_PROVINCES = [
  'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT',
] as const

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  scheduled: 'Agendada',
  confirmed: 'Confirmada',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  no_show: 'Não compareceu',
}

export const MODALITY_LABELS: Record<string, string> = {
  telehealth: 'Tele-fisioterapia',
  home_visit: 'Atendimento domiciliar',
}

export const CLINICAL_STATUS_LABELS: Record<string, string> = {
  awaiting_assessment: 'Aguardando avaliação',
  in_treatment: 'Em tratamento',
  paused: 'Pausado',
  reassessment: 'Em reavaliação',
  discharged: 'Alta',
}

export const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  no_account: 'Sem conta',
  invite_pending: 'Convite pendente',
  active: 'Conta ativa',
}

export const GOAL_METRIC_LABELS: Record<string, string> = {
  distance: 'Distância',
  reps: 'Repetições',
  pain_scale: 'Escala de dor',
  custom: 'Personalizado',
}

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Fácil',
  moderate: 'Moderado',
  hard: 'Difícil',
}
