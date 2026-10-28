import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ProtectedRoute, RoleGuard, GuestRoute, SubscriptionGuard } from '@/features/auth/ui/guards'
import { HomePage, NotFoundPage } from '@/pages/home-page'
import { LoginPage, SignupPage, ForgotPasswordPage, InviteAcceptPage, CaregiverSignupPage } from '@/pages/auth/auth-pages'
import {
  PatientDashboardPage,
  PatientProfilePage,
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
  PhysioBillingPage,
  PhysioPatientsPage,
  PhysioPatientNewPage,
  PhysioPatientDetailPage,
  PhysioAppointmentNewPage,
  PhysioAppointmentDetailPage,
  PhysioProfilePage,
  PhysioNotificationsPage,
} from '@/pages/physio/physio-pages'
import { PhysioSubscriptionPage } from '@/pages/physio/subscription-page'
import { PhysioPatientReportPage, PhysioReportsPage } from '@/features/patient-report/ui/patient-report-page'
import { PhysioToolDetailPage } from '@/features/clinical-tools/ui/tool-detail-page'
import { PhysioToolsPage } from '@/features/clinical-tools/ui/tools-page'
import {
  AdminDashboardPage,
  AdminUsersPage,
  AdminAppointmentsPage,
  AdminAuditLogsPage,
} from '@/pages/admin/admin-pages'
import { CaregiverDashboardPage } from '@/pages/caregiver/caregiver-pages'
import { ROUTES } from '@/shared/config/routes'

function PhysioRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['physiotherapist']}>
        <SubscriptionGuard>{children}</SubscriptionGuard>
      </RoleGuard>
    </ProtectedRoute>
  )
}

export const router = createBrowserRouter([
  { path: ROUTES.home, element: <HomePage /> },
  { path: ROUTES.login, element: <GuestRoute><LoginPage /></GuestRoute> },
  { path: ROUTES.signup, element: <GuestRoute><SignupPage /></GuestRoute> },
  { path: ROUTES.forgotPassword, element: <GuestRoute><ForgotPasswordPage /></GuestRoute> },
  { path: '/auth/invite/:token', element: <GuestRoute><InviteAcceptPage /></GuestRoute> },
  { path: '/auth/caregiver-signup', element: <GuestRoute><CaregiverSignupPage /></GuestRoute> },

  {
    path: ROUTES.patient.dashboard,
    element: <ProtectedRoute><RoleGuard allowedRoles={['patient']}><PatientDashboardPage /></RoleGuard></ProtectedRoute>,
  },
  {
    path: ROUTES.patient.profile,
    element: <ProtectedRoute><RoleGuard allowedRoles={['patient']}><PatientProfilePage /></RoleGuard></ProtectedRoute>,
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
    path: ROUTES.physio.subscription,
    element: (
      <ProtectedRoute>
        <RoleGuard allowedRoles={['physiotherapist']}>
          <PhysioSubscriptionPage />
        </RoleGuard>
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.physio.dashboard,
    element: <PhysioRoute><PhysioDashboardPage /></PhysioRoute>,
  },
  {
    path: ROUTES.physio.agenda,
    element: <PhysioRoute><PhysioAgendaPage /></PhysioRoute>,
  },
  {
    path: ROUTES.physio.billing,
    element: <PhysioRoute><PhysioBillingPage /></PhysioRoute>,
  },
  {
    path: ROUTES.physio.reports,
    element: <PhysioRoute><PhysioReportsPage /></PhysioRoute>,
  },
  {
    path: ROUTES.physio.tools,
    element: <PhysioRoute><PhysioToolsPage /></PhysioRoute>,
  },
  {
    path: '/physio/ferramentas/:slug',
    element: <PhysioRoute><PhysioToolDetailPage /></PhysioRoute>,
  },
  {
    path: ROUTES.physio.patients,
    element: <PhysioRoute><PhysioPatientsPage /></PhysioRoute>,
  },
  {
    path: ROUTES.physio.patientNew,
    element: <PhysioRoute><PhysioPatientNewPage /></PhysioRoute>,
  },
  {
    path: '/physio/patients/:id/relatorio',
    element: <PhysioRoute><PhysioPatientReportPage /></PhysioRoute>,
  },
  {
    path: '/physio/patients/:id',
    element: <PhysioRoute><PhysioPatientDetailPage /></PhysioRoute>,
  },
  {
    path: ROUTES.physio.appointmentNew,
    element: <PhysioRoute><PhysioAppointmentNewPage /></PhysioRoute>,
  },
  {
    path: '/physio/appointments/:id',
    element: <PhysioRoute><PhysioAppointmentDetailPage /></PhysioRoute>,
  },
  {
    path: ROUTES.physio.profile,
    element: <PhysioRoute><PhysioProfilePage /></PhysioRoute>,
  },
  {
    path: ROUTES.physio.notifications,
    element: <PhysioRoute><PhysioNotificationsPage /></PhysioRoute>,
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
