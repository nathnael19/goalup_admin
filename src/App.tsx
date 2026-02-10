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
              <Route path="tournaments" element={<TournamentsPage />} />
              <Route path="teams" element={<TeamsPage />} />
              <Route path="teams/:id" element={<TeamDetailPage />} />
              <Route path="players" element={<PlayersPage />} />
              <Route path="matches" element={<MatchesPage />} />
              <Route path="standings" element={<StandingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
