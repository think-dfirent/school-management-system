import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = useAuthStore((state) => state.token);

  const user = useAuthStore((state) => state.user);

  if (!token) {
    // Not logged in -> go to login page
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Logged in but wrong role -> redirect to their respective dashboard
    if (user.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === "instructor") {
      return <Navigate to="/instructor/dashboard" replace />;
    } else {
      return <Navigate to="/student/dashboard" replace />;
    }
  }
  return children;
};

export default ProtectedRoute;
