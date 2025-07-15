
import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div
      className="animate-spin rounded-full h-10 w-10 border-b-2 border-t-2 border-cyan-400"
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
