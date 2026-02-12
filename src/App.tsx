import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { MainLayout } from "./layouts/MainLayout";
import { TournamentsPage } from "./pages/TournamentsPage";
import { TeamsPage } from "./pages/TeamsPage";
import { PlayersPage } from "./pages/PlayersPage";
import { MatchesPage } from "./pages/MatchesPage";
import { StandingsPage } from "./pages/StandingsPage";
import { TeamDetailPage } from "./pages/TeamDetailPage";
import { MatchDetailPage } from "./pages/MatchDetailPage";
import { NewsPage } from "./pages/NewsPage";
import { UsersPage } from "./pages/UsersPage";
import { UserRoles } from "./types";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
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
                    allowedRoles={[
                      UserRoles.SUPER_ADMIN,
                      UserRoles.TOURNAMENT_ADMIN,
                      UserRoles.COACH,
                    ]}
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
                path="standings"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      UserRoles.SUPER_ADMIN,
                      UserRoles.TOURNAMENT_ADMIN,
                      UserRoles.COACH,
                      UserRoles.REFEREE,
                    ]}
                  >
                    <StandingsPage />
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
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
