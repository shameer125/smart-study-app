import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { HiOutlineSparkles } from "react-icons/hi";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-aurora bg-[length:200%_200%] animate-gradient-x flex items-center justify-center shadow-glow">
            <HiOutlineSparkles className="w-7 h-7 text-white animate-pulse" />
          </div>
          <div className="text-sm text-slate-500">Loading SmartStudy…</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
