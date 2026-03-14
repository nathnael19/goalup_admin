import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { RealtimeProvider } from "./components/RealtimeProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MainLayout } from "./layouts/MainLayout";
import { UserRoles } from "./types";

// Lazy load pages
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const TournamentsPage = lazy(() =>
  import("./pages/TournamentsPage").then((m) => ({
    default: m.TournamentsPage,
  })),
);
const CompetitionsPage = lazy(() =>
  import("./pages/CompetitionsPage").then((m) => ({
    default: m.CompetitionsPage,
  })),
);
const TeamsPage = lazy(() =>
  import("./pages/TeamsPage").then((m) => ({ default: m.TeamsPage })),
);
const PlayersPage = lazy(() =>
  import("./pages/PlayersPage").then((m) => ({ default: m.PlayersPage })),
);
const MatchesPage = lazy(() =>
  import("./pages/MatchesPage").then((m) => ({ default: m.MatchesPage })),
);
const TeamDetailPage = lazy(() =>
  import("./pages/TeamDetailPage").then((m) => ({ default: m.TeamDetailPage })),
);
const MatchDetailPage = lazy(() =>
  import("./pages/MatchDetailPage").then((m) => ({
    default: m.MatchDetailPage,
  })),
);
const NewsPage = lazy(() =>
  import("./pages/NewsPage").then((m) => ({ default: m.NewsPage })),
);
const UsersPage = lazy(() =>
  import("./pages/UsersPage").then((m) => ({ default: m.UsersPage })),
);
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const SetupPasswordPage = lazy(() =>
  import("./pages/SetupPasswordPage").then((m) => ({
    default: m.SetupPasswordPage,
  })),
);
const ForgotPasswordPage = lazy(() =>
  import("./pages/ForgotPasswordPage").then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import("./pages/ResetPasswordPage").then((m) => ({
    default: m.ResetPasswordPage,
  })),
);
const LandingPage = lazy(() =>
  import("./pages/LandingPage").then((m) => ({ default: m.LandingPage })),
);

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RealtimeProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/setup-password" element={<SetupPasswordPage />} />
                <Route
                  element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route
                    path="tournaments"
                    element={
                      <ProtectedRoute
                        allowedRoles={[
                          UserRoles.SUPER_ADMIN,
                          UserRoles.TOURNAMENT_ADMIN,
                        ]}
                      >
                        <TournamentsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="competitions"
                    element={
                      <ProtectedRoute
                        allowedRoles={[
                          UserRoles.SUPER_ADMIN,
                          UserRoles.TOURNAMENT_ADMIN,
                        ]}
                      >
                        <CompetitionsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="teams"
                    element={
                      <ProtectedRoute
                        allowedRoles={[
                          UserRoles.SUPER_ADMIN,
                          UserRoles.TOURNAMENT_ADMIN,
                        ]}
                      >
                        <TeamsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="teams/:id"
                    element={
                      <ProtectedRoute
                        allowedRoles={[
                          UserRoles.SUPER_ADMIN,
                          UserRoles.TOURNAMENT_ADMIN,
                          UserRoles.COACH,
                        ]}
                      >
                        <TeamDetailPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="players"
                    element={
                      <ProtectedRoute
                        allowedRoles={[UserRoles.SUPER_ADMIN, UserRoles.COACH]}
                      >
                        <PlayersPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="matches"
                    element={
                      <ProtectedRoute
                        allowedRoles={[
                          UserRoles.SUPER_ADMIN,
                          UserRoles.TOURNAMENT_ADMIN,
                          UserRoles.COACH,
                          UserRoles.REFEREE,
                        ]}
                      >
                        <MatchesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="matches/:id"
                    element={
                      <ProtectedRoute
                        allowedRoles={[
                          UserRoles.SUPER_ADMIN,
                          UserRoles.TOURNAMENT_ADMIN,
                          UserRoles.COACH,
                          UserRoles.REFEREE,
                        ]}
                      >
                        <MatchDetailPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="news"
                    element={
                      <ProtectedRoute
                        allowedRoles={[
                          UserRoles.SUPER_ADMIN,
                          UserRoles.NEWS_REPORTER,
                        ]}
                      >
                        <NewsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="users"
                    element={
                      <ProtectedRoute
                        allowedRoles={[
                          UserRoles.SUPER_ADMIN,
                          UserRoles.TOURNAMENT_ADMIN,
                        ]}
                      >
                        <UsersPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="profile" element={<ProfilePage />} />
                </Route>
                <Route
                  path="*"
                  element={
                    <main className="min-h-[60vh] flex flex-col items-center justify-center px-4">
                      <p className="text-sm font-bold tracking-[0.3em] text-blue-500 uppercase mb-4">
                        404 · Page Not Found
                      </p>
                      <h1 className="text-3xl md:text-4xl font-black text-white mb-3">
                        This page has been substituted.
                      </h1>
                      <p className="text-slate-400 max-w-md text-center mb-6">
                        The route you requested doesn&apos;t exist. Use the navigation
                        menu or return to your dashboard.
                      </p>
                      <Navigate to="/dashboard" replace />
                    </main>
                  }
                />
              </Routes>
            </Suspense>
          </BrowserRouter>
          <ConnectionStatus />
        </RealtimeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
