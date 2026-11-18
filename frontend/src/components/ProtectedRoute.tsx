import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F3F0E9] flex items-center justify-center text-[#111110]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#14bfb9] border-t-transparent" />
          <p className="font-mono-hl text-xs tracking-wider uppercase text-[#111110]/60">
            Verifying Editor Credentials...
          </p>
        </div>
      </div>
    );
  }

  if (!user || !user.is_editor) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
