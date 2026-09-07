import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import {
  useAuth,
} from "../contexts/AuthContext";

function ProtectedRoute({
  children,
}) {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-slate-50
        dark:bg-slate-950
      ">
        <div className="
          flex
          flex-col
          items-center
          gap-3
        ">
          <div className="
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-2xl
            bg-indigo-50
            text-indigo-600
            dark:bg-indigo-500/10
            dark:text-indigo-400
          ">
            <Loader2
              size={23}
              className="animate-spin"
            />
          </div>

          <p className="
            text-sm
            font-medium
            text-slate-500
            dark:text-slate-400
          ">
            Loading CampusHub...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;