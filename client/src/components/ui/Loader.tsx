import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-6">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
    </div>
  );
};
