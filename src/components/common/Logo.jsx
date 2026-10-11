import React from 'react';

export function SyncFileIcon({ className = 'w-9 h-9' }) {
  return (
    <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/20 ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3/5 h-3/5"
      >
        {/* Cloud outline */}
        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
        {/* File outline inside */}
        <path d="M11 12.5h3" strokeWidth="1.75" />
        <path d="M11 15.5h2" strokeWidth="1.75" />
      </svg>
    </div>
  );
}

export function Logo({ showTagline = false, size = 'default' }) {
  const isLarge = size === 'large';

  return (
    <div className="flex items-center gap-3 select-none">
      <SyncFileIcon className={isLarge ? 'w-11 h-11' : 'w-9 h-9'} />
      <div>
        <div className="flex items-center gap-1.5">
          <span className={`font-bold tracking-tight text-slate-900 ${isLarge ? 'text-2xl' : 'text-xl'}`}>
            Sync<span className="text-indigo-600">File</span>
          </span>
          <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60">
            Student
          </span>
        </div>
        {showTagline && (
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Your files. Anywhere. Anytime.
          </p>
        )}
      </div>
    </div>
  );
}

