'use client';

import React, { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error boundary caught:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#090c10] text-[#f0f6fc] p-6 text-center">
      <h2 className="text-2xl font-bold text-red-400">Something went wrong</h2>
      <p className="text-sm text-gray-400 mt-2 max-w-md">
        {error.message || 'An unexpected error occurred while loading AI YouTube Studio.'}
      </p>
      <button
        onClick={() => reset()}
        className="mt-6 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
