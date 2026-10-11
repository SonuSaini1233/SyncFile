import React from 'react';

export function ProgressBar({
  percentage = 0,
  showLabel = false,
  size = 'md',
  animate = true,
  colorScheme = 'auto', // 'auto' | 'indigo' | 'emerald' | 'rose'
}) {
  const clamped = Math.min(100, Math.max(0, percentage));

  let barColor = 'bg-indigo-600';
  if (colorScheme === 'auto') {
    if (clamped >= 90) {
      barColor = 'bg-rose-500';
    } else if (clamped >= 75) {
      barColor = 'bg-amber-500';
    } else {
      barColor = 'bg-indigo-600';
    }
  } else if (colorScheme === 'emerald') {
    barColor = 'bg-emerald-500';
  } else if (colorScheme === 'rose') {
    barColor = 'bg-rose-500';
  } else if (colorScheme === 'indigo') {
    barColor = 'bg-indigo-600';
  }

  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';

  return (
    <div className="w-full">
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${heightClass}`}>
        <div
          className={`${heightClass} ${barColor} rounded-full transition-all ${
            animate ? 'duration-500 ease-out' : ''
          }`}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin="0"
          aria-valuemax="100"
        />
      </div>
      {showLabel && (
        <div className="flex justify-between items-center mt-1 text-xs text-slate-500">
          <span>{clamped}% used</span>
          <span>100% max</span>
        </div>
      )}
    </div>
  );
}

