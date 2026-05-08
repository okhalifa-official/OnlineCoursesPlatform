import { Navigate } from "react-router-dom";
import { getAdminToken } from "../api/apiClient";

export default function PublicRoute({ children }) {
  const token = getAdminToken();

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}