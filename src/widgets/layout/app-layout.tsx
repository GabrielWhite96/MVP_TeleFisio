import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  User,
  Dumbbell,
  Users,
  ClipboardList,
  Menu,
  X,
  LogOut,
  Activity,
  HeartPulse,
  Bell,
  ScrollText,
  HeartHandshake,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { signOut } from '@/features/auth/api/auth-api'
import { ConsentModal } from '@/features/consent/ui/consent-modal'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { pt } from '@/shared/config/i18n/pt'
import { ROUTES } from '@/shared/config/routes'
import type { UserRole } from '@/shared/types/database'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navByRole: Record<UserRole, NavItem[]> = {
  patient: [
    { label: pt.patient.dashboard, href: ROUTES.patient.dashboard, icon: LayoutDashboard },
    { label: 'Consultas', href: ROUTES.patient.appointments, icon: Calendar },
    { label: pt.patient.exercises, href: ROUTES.patient.exercises, icon: Dumbbell },
    { label: pt.patient.howAmI, href: ROUTES.patient.checkIn, icon: HeartPulse },
    { label: pt.patient.notifications, href: ROUTES.patient.notifications, icon: Bell },
    { label: pt.patient.caregivers, href: ROUTES.patient.caregivers, icon: Users },
    { label: pt.patient.profile, href: ROUTES.patient.profile, icon: User },
  ],
  physiotherapist: [
    { label: pt.physio.dashboard, href: ROUTES.physio.dashboard, icon: LayoutDashboard },
    { label: pt.physio.agenda, href: ROUTES.physio.agenda, icon: Calendar },
    { label: pt.physio.patients, href: ROUTES.physio.patients, icon: Users },
    { label: pt.patient.profile, href: '/physio/profile', icon: User },
  ],
  caregiver: [
    { label: pt.caregiver.dashboard, href: ROUTES.caregiver.dashboard, icon: HeartHandshake },
  ],
  admin: [
    { label: pt.admin.dashboard, href: ROUTES.admin.dashboard, icon: LayoutDashboard },
    { label: pt.admin.users, href: ROUTES.admin.users, icon: Users },
    { label: pt.admin.appointments, href: ROUTES.admin.appointments, icon: ClipboardList },
    { label: pt.admin.auditLogs, href: ROUTES.admin.auditLogs, icon: ScrollText },
  ],
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!profile) return <>{children}</>

  const navItems = navByRole[profile.role]
  const isPatient = profile.role === 'patient'
  const patientMobileHrefs: string[] = [
    ROUTES.patient.appointments,
    ROUTES.patient.exercises,
    ROUTES.patient.checkIn,
  ]
  const mobileNavItems = isPatient
    ? navItems.filter((item) => patientMobileHrefs.includes(item.href))
    : navItems.slice(0, 4)

  const handleLogout = async () => {
    await signOut()
    navigate('/auth/login')
  }

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon
        const active = location.pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => mobile && setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isPatient && 'min-h-12 py-3 text-base md:min-h-0 md:py-2 md:text-sm',
              active
                ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]'
            )}
          >
            <Icon className={cn('h-4 w-4', isPatient && 'h-5 w-5')} />
            {item.label}
          </Link>
        )
      })}
    </>
  )

  return (
    <div className="flex min-h-screen">
      <ConsentModal />
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-[var(--color-card)] md:flex">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Activity className="h-6 w-6 text-[var(--color-primary)]" />
          <span className="font-bold">{pt.app.name}</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <NavLinks />
        </nav>
        <div className="border-t p-4">
          <p className="mb-2 truncate text-sm font-medium">{profile.full_name}</p>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            {pt.auth.logout}
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4 md:hidden">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[var(--color-primary)]" />
            <span className="font-bold">{pt.app.name}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </header>

        {mobileOpen && (
          <div className="border-b bg-[var(--color-card)] p-4 md:hidden">
            <nav className="space-y-1">
              <NavLinks mobile />
            </nav>
            <Button variant="ghost" size="sm" className="mt-4 w-full justify-start" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              {pt.auth.logout}
            </Button>
          </div>
        )}

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">{children}</main>

        {/* Mobile bottom nav — larger touch targets for patients */}
        <nav className="flex border-t bg-[var(--color-card)] md:hidden">
          {mobileNavItems.map((item) => {
            const Icon = item.icon
            const active = location.pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-xs',
                  isPatient && 'min-h-16 py-3 text-sm',
                  active ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted-foreground)]'
                )}
              >
                <Icon className={cn('h-5 w-5', isPatient && 'h-6 w-6')} />
                <span className="truncate px-1">{item.label.split(' ')[0]}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
