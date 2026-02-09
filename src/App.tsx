import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { MainLayout } from "./layouts/MainLayout";

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
                  <div className="p-8 text-white">
                    Tournaments (Coming Soon)
                  </div>
                }
              />
              <Route
                path="teams"
                element={
                  <div className="p-8 text-white">Teams (Coming Soon)</div>
                }
              />
              <Route
                path="players"
                element={
                  <div className="p-8 text-white">Players (Coming Soon)</div>
                }
              />
              <Route
                path="matches"
                element={
                  <div className="p-8 text-white">Matches (Coming Soon)</div>
                }
              />
              <Route
                path="standings"
                element={
                  <div className="p-8 text-white">Standings (Coming Soon)</div>
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
