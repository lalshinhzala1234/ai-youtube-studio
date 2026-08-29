import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#090c10] text-[#f0f6fc] p-6 text-center">
      <h1 className="text-4xl font-extrabold text-red-500">404</h1>
      <h2 className="text-xl font-bold mt-2">Page Not Found</h2>
      <p className="text-sm text-gray-400 mt-1 max-w-sm">
        The requested page does not exist in AI YouTube Studio.
      </p>
      <Link
        href="/"
        className="mt-6 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
