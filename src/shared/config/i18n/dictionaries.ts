import { pt } from './pt'

export type Locale = 'pt' | 'en'

export const en = {
  app: { name: 'TeleFisio', tagline: 'Tele-physiotherapy and home rehabilitation' },
  auth: {
    login: 'Sign in',
    signup: 'Create account',
    signupPhysio: 'Create professional account',
    signupPhysioDescription: 'Sign up to manage your patients and treatments.',
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
    inviteTitle: 'Activate patient account',
    inviteDescription: '{physio} invited you. Set your password to access the portal ({email}).',
    inviteInvalidTitle: 'Invalid or expired invite',
    inviteInvalidDescription: 'Ask your physiotherapist to resend the invite.',
    inviteAcceptedTitle: 'Account already active',
    inviteAcceptedDescription: 'Sign in to access your portal.',
    activateAccount: 'Activate account',
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
