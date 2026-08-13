import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ProtectedRoute, RoleGuard, GuestRoute } from '@/features/auth/ui/guards'
import { HomePage, NotFoundPage } from '@/pages/home-page'
import { LoginPage, SignupPage, ForgotPasswordPage } from '@/pages/auth/auth-pages'
import {
  PatientDashboardPage,
  PatientProfilePage,
  PatientBookPage,
  PatientAppointmentsPage,
  PatientAppointmentDetailPage,
  PatientExercisesPage,
  PatientCheckInPage,
  PatientNotificationsPage,
  PatientCaregiversPage,
} from '@/pages/patient/patient-pages'
import {
  PhysioDashboardPage,
  PhysioAgendaPage,
  PhysioPatientsPage,
  PhysioPatientDetailPage,
  PhysioAppointmentDetailPage,
  PhysioProfilePage,
} from '@/pages/physio/physio-pages'
import {
  AdminDashboardPage,
  AdminUsersPage,
  AdminAppointmentsPage,
  AdminAuditLogsPage,
} from '@/pages/admin/admin-pages'
import { CaregiverDashboardPage } from '@/pages/caregiver/caregiver-pages'
import { ROUTES } from '@/shared/config/routes'

export const router = createBrowserRouter([
  { path: ROUTES.home, element: <HomePage /> },
  { path: ROUTES.login, element: <GuestRoute><LoginPage /></GuestRoute> },
  { path: ROUTES.signup, element: <GuestRoute><SignupPage /></GuestRoute> },
  { path: ROUTES.forgotPassword, element: <GuestRoute><ForgotPasswordPage /></GuestRoute> },

  {
    path: ROUTES.patient.dashboard,
    element: <ProtectedRoute><RoleGuard allowedRoles={['patient']}><PatientDashboardPage /></RoleGuard></ProtectedRoute>,
  },
  {
    path: ROUTES.patient.profile,
    element: <ProtectedRoute><RoleGuard allowedRoles={['patient']}><PatientProfilePage /></RoleGuard></ProtectedRoute>,
  },
  {
    path: ROUTES.patient.book,
    element: <ProtectedRoute><RoleGuard allowedRoles={['patient']}><PatientBookPage /></RoleGuard></ProtectedRoute>,
  },
  {
    path: ROUTES.patient.appointments,
    element: <ProtectedRoute><RoleGuard allowedRoles={['patient']}><PatientAppointmentsPage /></RoleGuard></ProtectedRoute>,
  },
  {
    path: '/patient/appointments/:id',
    element: <ProtectedRoute><RoleGuard allowedRoles={['patient']}><PatientAppointmentDetailPage /></RoleGuard></ProtectedRoute>,
  },
  {
    path: ROUTES.patient.exercises,
    element: <ProtectedRoute><RoleGuard allowedRoles={['patient']}><PatientExercisesPage /></RoleGuard></ProtectedRoute>,
  },
  {
    path: ROUTES.patient.checkIn,
    element: <ProtectedRoute><RoleGuard allowedRoles={['patient']}><PatientCheckInPage /></RoleGuard></ProtectedRoute>,
  },
  {
    path: ROUTES.patient.notifications,
    element: <ProtectedRoute><RoleGuard allowedRoles={['patient']}><PatientNotificationsPage /></RoleGuard></ProtectedRoute>,
  },
  {
    path: ROUTES.patient.caregivers,
    element: <ProtectedRoute><RoleGuard allowedRoles={['patient']}><PatientCaregiversPage /></RoleGuard></ProtectedRoute>,
  },

  {
    path: ROUTES.physio.dashboard,
    element: <ProtectedRoute><RoleGuard allowedRoles={['physiotherapist']}><PhysioDashboardPage /></RoleGuard></ProtectedRoute>,
  },
  {
    path: ROUTES.physio.agenda,
    element: <ProtectedRoute><RoleGuard allowedRoles={['physiotherapist']}><PhysioAgendaPage /></RoleGuard></ProtectedRoute>,
  },
  {
    path: ROUTES.physio.patients,
    element: <ProtectedRoute><RoleGuard allowedRoles={['physiotherapist']}><PhysioPatientsPage /></RoleGuard></ProtectedRoute>,
  },
  {
    path: '/physio/patients/:id',
    element: <ProtectedRoute><RoleGuard allowedRoles={['physiotherapist']}><PhysioPatientDetailPage /></RoleGuard></ProtectedRoute>,
  },
  {
    path: '/physio/appointments/:id',
    element: <ProtectedRoute><RoleGuard allowedRoles={['physiotherapist']}><PhysioAppointmentDetailPage /></RoleGuard></ProtectedRoute>,
  },
  {
    path: '/physio/profile',
    element: <ProtectedRoute><RoleGuard allowedRoles={['physiotherapist']}><PhysioProfilePage /></RoleGuard></ProtectedRoute>,
  },

  {
    path: ROUTES.caregiver.dashboard,
    element: <ProtectedRoute><RoleGuard allowedRoles={['caregiver']}><CaregiverDashboardPage /></RoleGuard></ProtectedRoute>,
  },

  {
    path: ROUTES.admin.dashboard,
    element: <ProtectedRoute><RoleGuard allowedRoles={['admin']}><AdminDashboardPage /></RoleGuard></ProtectedRoute>,
  },
  {
    path: ROUTES.admin.users,
    element: <ProtectedRoute><RoleGuard allowedRoles={['admin']}><AdminUsersPage /></RoleGuard></ProtectedRoute>,
  },
  {
    path: ROUTES.admin.appointments,
    element: <ProtectedRoute><RoleGuard allowedRoles={['admin']}><AdminAppointmentsPage /></RoleGuard></ProtectedRoute>,
  },
  {
    path: ROUTES.admin.auditLogs,
    element: <ProtectedRoute><RoleGuard allowedRoles={['admin']}><AdminAuditLogsPage /></RoleGuard></ProtectedRoute>,
  },

  { path: '*', element: <NotFoundPage /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
