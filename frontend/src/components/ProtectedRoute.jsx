import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, initAuth } = useAuthStore();
  const location = useLocation();

  // A refresh wipes the in-memory store, but login writes to localStorage;
  // presence of a stored token means we are mid-rehydration, not logged out.
  const hasStoredAuth = Boolean(localStorage.getItem("token"));

  // Rehydrate auth state (idempotent) so a page refresh keeps the session
  useEffect(() => {
    if (!isAuthenticated && hasStoredAuth) {
      initAuth();
    }
  }, [isAuthenticated, hasStoredAuth, initAuth]);

  if (!isAuthenticated && hasStoredAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
