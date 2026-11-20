import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { HomePage } from '@/pages/home-page'
import { RoleGuard } from '@/features/auth/ui/guards'
import { ROUTES } from '@/shared/config/routes'
import { pt } from '@/shared/config/i18n/pt'

const isNativePlatform = vi.fn(() => false)
const authState = vi.hoisted(() => ({
  isAuthenticated: false,
  profile: undefined as
    | { id: string; role: 'patient' | 'physiotherapist' | 'admin' | 'caregiver' }
    | undefined,
  isLoading: false,
  user: null as null,
  session: null as null,
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => isNativePlatform(),
    getPlatform: () => (isNativePlatform() ? 'ios' : 'web'),
  },
}))

vi.mock('@/features/auth/hooks/use-auth', () => ({
  useAuth: () => ({
    isAuthenticated: authState.isAuthenticated,
    profile: authState.profile,
    isLoading: authState.isLoading,
    user: authState.user,
    session: authState.session,
  }),
}))

vi.mock('@/pages/landing/landing-page', () => ({
  LandingPage: () => <div data-testid="landing-page">Landing</div>,
}))

describe('native auth routing', () => {
  beforeEach(() => {
    isNativePlatform.mockReturnValue(false)
    authState.isAuthenticated = false
    authState.profile = undefined
    authState.isLoading = false
  })

  it('renders landing for web guests on /', () => {
    render(
      <MemoryRouter initialEntries={[ROUTES.home]}>
        <Routes>
          <Route path={ROUTES.home} element={<HomePage />} />
          <Route path={ROUTES.login} element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByTestId('landing-page')).toBeInTheDocument()
  })

  it('redirects native guests from / to login', () => {
    isNativePlatform.mockReturnValue(true)
    render(
      <MemoryRouter initialEntries={[ROUTES.home]}>
        <Routes>
          <Route path={ROUTES.home} element={<HomePage />} />
          <Route path={ROUTES.login} element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByTestId('landing-page')).not.toBeInTheDocument()
  })

  it('shows native boot screen while auth loads on /', () => {
    isNativePlatform.mockReturnValue(true)
    authState.isLoading = true
    render(
      <MemoryRouter initialEntries={[ROUTES.home]}>
        <HomePage />
      </MemoryRouter>
    )
    expect(screen.getByLabelText(pt.common.loading)).toBeInTheDocument()
  })

  it('sends wrong-role users to their dashboard on native instead of home', () => {
    isNativePlatform.mockReturnValue(true)
    authState.isAuthenticated = true
    authState.profile = { id: 'u1', role: 'patient' }

    render(
      <MemoryRouter initialEntries={['/physio/dashboard']}>
        <Routes>
          <Route
            path="/physio/dashboard"
            element={
              <RoleGuard allowedRoles={['physiotherapist']}>
                <div>Physio only</div>
              </RoleGuard>
            }
          />
          <Route path={ROUTES.patient.dashboard} element={<div>Patient dashboard</div>} />
          <Route path={ROUTES.home} element={<div>Home</div>} />
          <Route path={ROUTES.login} element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Patient dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Physio only')).not.toBeInTheDocument()
    expect(screen.queryByText('Home')).not.toBeInTheDocument()
  })
})
