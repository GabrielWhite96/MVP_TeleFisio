import { pt } from './pt'

export type Locale = 'pt' | 'en'

export const en = {
  app: { name: 'TeleFisio', tagline: 'Tele-physiotherapy and home rehabilitation' },
  auth: {
    login: 'Sign in',
    signup: 'Create account',
    logout: 'Sign out',
    email: 'Email',
    password: 'Password',
    fullName: 'Full name',
    forgotPassword: 'Forgot password',
    resetPassword: 'Reset password',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    rolePatient: 'I am a patient',
    rolePhysio: 'I am a physiotherapist',
    roleCaregiver: 'I am a family caregiver',
    resetSent: 'Recovery email sent.',
    greeting: 'Good morning',
  },
  common: {
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    loading: 'Loading...',
    error: 'Error',
    retry: 'Try again',
    back: 'Back',
    next: 'Next',
    empty: 'Nothing found',
    viewAll: 'View all',
    add: 'Add',
    remove: 'Remove',
    close: 'Close',
    required: 'Required',
  },
} as const

export const dictionaries = { pt, en }
