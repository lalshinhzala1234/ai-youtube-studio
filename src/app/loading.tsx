import React from 'react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#090c10] text-[#f0f6fc]">
      <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs text-gray-400 mt-4 font-semibold uppercase tracking-wider">
        Loading AI YouTube Studio...
      </p>
    </div>
  );
}
