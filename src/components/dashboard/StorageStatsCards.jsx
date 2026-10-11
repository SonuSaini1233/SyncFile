import React from 'react';
import { Files, HardDrive, Database, PieChart } from 'lucide-react';
import { useFiles } from '../../context/FileContext';
import {
  formatBytes,
  calculateStoragePercentage,
  TOTAL_QUOTA_BYTES,
} from '../../utils/formatters';
import { ProgressBar } from '../common/ProgressBar';

export function StorageStatsCards() {
  const { rawFilesCount, totalStorageUsedBytes, remainingStorageBytes } = useFiles();

  const usagePercent = calculateStoragePercentage(totalStorageUsedBytes, TOTAL_QUOTA_BYTES);

  const stats = [
    {
      title: 'Total Files',
      value: rawFilesCount,
      subtext: rawFilesCount === 1 ? '1 file uploaded' : `${rawFilesCount} files stored`,
      icon: Files,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
    },
    {
      title: 'Storage Used',
      value: formatBytes(totalStorageUsedBytes),
      subtext: `of ${formatBytes(TOTAL_QUOTA_BYTES)} quota`,
      icon: HardDrive,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
    },
    {
      title: 'Storage Remaining',
      value: formatBytes(remainingStorageBytes),
      subtext: remainingStorageBytes === 0 ? 'Quota full' : 'Available for uploads',
      icon: Database,
      iconColor: remainingStorageBytes < 2 * 1024 * 1024 ? 'text-amber-600' : 'text-emerald-600',
      iconBg: remainingStorageBytes < 2 * 1024 * 1024 ? 'bg-amber-50' : 'bg-emerald-50',
    },
    {
      title: 'Storage Quota',
      value: `${usagePercent}%`,
      subtext: `${formatBytes(totalStorageUsedBytes)} / 20 MB`,
      icon: PieChart,
      iconColor: usagePercent >= 90 ? 'text-rose-600' : 'text-indigo-600',
      iconBg: usagePercent >= 90 ? 'bg-rose-50' : 'bg-indigo-50',
      isProgress: true,
      progressValue: usagePercent,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow duration-200"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 tracking-wide uppercase">
                  {stat.title}
                </p>
                <h4 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
                  {stat.value}
                </h4>
              </div>
              <div className={`p-2.5 rounded-xl ${stat.iconBg}`}>
                <Icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
            </div>

            {stat.isProgress ? (
              <div className="mt-3.5">
                <ProgressBar percentage={stat.progressValue} size="sm" />
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  {stat.subtext}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-3 font-medium flex items-center gap-1.5">
                {stat.subtext}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

