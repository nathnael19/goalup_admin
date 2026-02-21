import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
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
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
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
                    <ProtectedRoute allowedRoles={[UserRoles.SUPER_ADMIN]}>
                      <UsersPage />
                    </ProtectedRoute>
                  }
                />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
