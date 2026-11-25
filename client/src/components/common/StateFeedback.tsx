import React from 'react';
import { AlertCircle, Inbox } from 'lucide-react';
import { Button } from './Button';

export const PageSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading content">
    <div className="h-9 w-64 rounded-[8px] bg-black/[0.08]" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="notion-card p-5 h-28 bg-white/80" />
      ))}
    </div>
    <div className="notion-card p-6 h-72 bg-white/80" />
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ title, description, action }) => (
  <div className="notion-card p-10 text-center bg-white">
    <Inbox className="w-8 h-8 text-[#757575] mx-auto mb-3" />
    <h3 className="text-[17px] font-semibold text-black">{title}</h3>
    <p className="mt-1.5 text-[14px] text-[#615d59] max-w-md mx-auto">{description}</p>
    {action && <div className="mt-5 flex justify-center">{action}</div>}
  </div>
);

export const ErrorState: React.FC<{
  message: string;
  onRetry?: () => void;
}> = ({ message, onRetry }) => (
  <div className="notion-card p-8 text-center bg-white border-[#f64932]/30">
    <AlertCircle className="w-8 h-8 text-[#e32d14] mx-auto mb-3" />
    <h3 className="text-[17px] font-semibold text-black">Unable to load data</h3>
    <p className="mt-1.5 text-[14px] text-[#615d59] max-w-md mx-auto">{message}</p>
    {onRetry && (
      <Button variant="secondary" size="sm" onClick={onRetry} className="mt-4">
        Try again
      </Button>
    )}
  </div>
);
