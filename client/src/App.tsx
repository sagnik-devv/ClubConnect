import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { PresidentClubProvider } from './context/PresidentClubContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { PresidentGuard } from './components/president/PresidentGuard';
import { LandingPage } from './pages/LandingPage';
import { DiscoverClubsPage } from './pages/DiscoverClubsPage';
import { ClubDetailsPage } from './pages/ClubDetailsPage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { ManagementDashboardPage } from './pages/ManagementDashboardPage';
import { TasksPage } from './pages/TasksPage';
import { ContributionsPage } from './pages/ContributionsPage';
import { RecruitmentPage } from './pages/RecruitmentPage';
import { EventsPage } from './pages/EventsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AboutPage } from './pages/AboutPage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { PresidentDashboardPage } from './pages/president/PresidentDashboardPage';
import { PresidentClubsPage } from './pages/president/PresidentClubsPage';
import { PresidentMembersPage } from './pages/president/PresidentMembersPage';
import { PresidentMembershipRequestsPage } from './pages/president/PresidentMembershipRequestsPage';
import { PresidentTasksPage } from './pages/president/PresidentTasksPage';
import { PresidentContributionsPage } from './pages/president/PresidentContributionsPage';
import { PresidentRecruitmentPage } from './pages/president/PresidentRecruitmentPage';
import { PresidentEventsPage } from './pages/president/PresidentEventsPage';
import { PresidentAnnouncementsPage } from './pages/president/PresidentAnnouncementsPage';
import { PresidentAnalyticsPage } from './pages/president/PresidentAnalyticsPage';
import { PresidentSettingsPage } from './pages/president/PresidentSettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PresidentClubProvider>
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/clubs" element={<DiscoverClubsPage />} />
            <Route path="/clubs/:id" element={<ClubDetailsPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/login" element={<LoginPage initialTab="signin" />} />
            <Route path="/register" element={<LoginPage initialTab="signup" />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <StudentDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage"
              element={
                <ProtectedRoute>
                  <ManagementDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <TasksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contributions"
              element={
                <ProtectedRoute>
                  <ContributionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment"
              element={
                <ProtectedRoute>
                  <RecruitmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* President Portal Routes */}
            <Route
              path="/president"
              element={
                <PresidentGuard>
                  <PresidentDashboardPage />
                </PresidentGuard>
              }
            />
            <Route
              path="/president/clubs"
              element={
                <PresidentGuard>
                  <PresidentClubsPage />
                </PresidentGuard>
              }
            />
            <Route
              path="/president/clubs/:clubId"
              element={
                <PresidentGuard>
                  <PresidentClubsPage />
                </PresidentGuard>
              }
            />
            <Route
              path="/president/members"
              element={
                <PresidentGuard>
                  <PresidentMembersPage />
                </PresidentGuard>
              }
            />
            <Route
              path="/president/membership-requests"
              element={
                <PresidentGuard>
                  <PresidentMembershipRequestsPage />
                </PresidentGuard>
              }
            />
            <Route
              path="/president/tasks"
              element={
                <PresidentGuard>
                  <PresidentTasksPage />
                </PresidentGuard>
              }
            />
            <Route
              path="/president/contributions"
              element={
                <PresidentGuard>
                  <PresidentContributionsPage />
                </PresidentGuard>
              }
            />
            <Route
              path="/president/recruitment"
              element={
                <PresidentGuard>
                  <PresidentRecruitmentPage />
                </PresidentGuard>
              }
            />
            <Route
              path="/president/events"
              element={
                <PresidentGuard>
                  <PresidentEventsPage />
                </PresidentGuard>
              }
            />
            <Route
              path="/president/announcements"
              element={
                <PresidentGuard>
                  <PresidentAnnouncementsPage />
                </PresidentGuard>
              }
            />
            <Route
              path="/president/analytics"
              element={
                <PresidentGuard>
                  <PresidentAnalyticsPage />
                </PresidentGuard>
              }
            />
            <Route
              path="/president/settings"
              element={
                <PresidentGuard>
                  <PresidentSettingsPage />
                </PresidentGuard>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        </PresidentClubProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#000000',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '10px',
              fontFamily: 'Inter, sans-serif',
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
