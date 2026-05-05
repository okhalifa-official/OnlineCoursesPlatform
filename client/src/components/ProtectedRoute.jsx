import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAdminToken, clearAdminToken } from "../api/apiClient";
import { getLoggedInAdmin } from "../api/authApi";

export default function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(function () {
    async function checkAdminAccess() {
      const token = getAdminToken();
      if (!token) {
        setIsAllowed(false);
        setChecking(false);
        return;
      }

      try {
        await getLoggedInAdmin();
        setIsAllowed(true);
      } catch (error) {
        clearAdminToken();
        setIsAllowed(false);
      } finally {
        setChecking(false);
      }
    }

    checkAdminAccess();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center">
        <p className="font-bold text-[#1A1A1A]">Checking access...</p>
      </div>
    );
  }

  if (!isAllowed) {
    return <Navigate to="/login" replace />;
  }

  return children;
}