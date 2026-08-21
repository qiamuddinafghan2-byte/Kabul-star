import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ role, children }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="h-8 w-8 rounded-full border-4 border-[#0F1E4F]/20 border-t-[#0F1E4F] animate-spin" />
      </div>
    );
  }

  if (!user || typeof user !== "object") {
    const to = role ? `/login/${role}` : "/login/student";
    return <Navigate to={to} replace state={{ from: location }} />;
  }

  if (role && user.role !== role) {
    // logged in but wrong role — send to their own dashboard
    const dash =
      user.role === "manager" ? "/dashboard/manager" :
      user.role === "teacher" ? "/dashboard/teacher" : "/dashboard/student";
    return <Navigate to={dash} replace />;
  }

  return children;
}
