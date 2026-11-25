import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { PageSkeleton } from '../common/StateFeedback';

export const PresidentGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, hasAnyLeadership } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f6f5f4] p-8 max-w-[1440px] mx-auto">
        <PageSkeleton />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!hasAnyLeadership) {
    return (
      <div className="min-h-screen bg-[#f6f5f4] flex items-center justify-center p-6">
        <div className="notion-card max-w-md w-full p-8 text-center">
          <ShieldAlert className="w-10 h-10 text-[#f64932] mx-auto mb-3" />
          <h1 className="text-[22px] font-bold text-black">President Portal Access Required</h1>
          <p className="mt-2 text-[14px] text-[#615d59]">
            You need an active leadership role (President, Vice President, Secretary, Treasurer, or Coordinator) in at least one club to access the President Portal.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button variant="primary" to="/dashboard">
              Go to Member Portal
            </Button>
            <Button variant="secondary" to="/clubs">
              Create or Join Club
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
