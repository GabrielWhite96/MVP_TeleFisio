import { LoginForm } from '@/features/auth/ui/login-form'
import { SignupForm } from '@/features/auth/ui/signup-form'
import { ForgotPasswordForm } from '@/features/auth/ui/forgot-password-form'
import { Activity } from 'lucide-react'
import { pt } from '@/shared/config/i18n/pt'

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-background)] p-4">
      <div className="mb-8 flex items-center gap-2">
        <Activity className="h-8 w-8 text-[var(--color-primary)]" />
        <span className="text-2xl font-bold">{pt.app.name}</span>
      </div>
      {children}
    </div>
  )
}

export function LoginPage() {
  return <AuthLayout><LoginForm /></AuthLayout>
}

export function SignupPage() {
  return <AuthLayout><SignupForm /></AuthLayout>
}

export function ForgotPasswordPage() {
  return <AuthLayout><ForgotPasswordForm /></AuthLayout>
}
