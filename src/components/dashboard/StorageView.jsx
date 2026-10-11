import React from 'react';
import {
  HardDrive,
  FileText,
  Image,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  FileQuestion,
  AlertTriangle,
} from 'lucide-react';
import { useFiles } from '../../context/FileContext';
import {
  formatBytes,
  calculateStoragePercentage,
  TOTAL_QUOTA_BYTES,
} from '../../utils/formatters';
import { ProgressBar } from '../common/ProgressBar';
import { getFileTypeInfo } from '../../utils/fileTypeIcons';

export function StorageView({ onOpenUploadModal }) {
  const { files, totalStorageUsedBytes, remainingStorageBytes } = useFiles();

  const usagePercent = calculateStoragePercentage(totalStorageUsedBytes, TOTAL_QUOTA_BYTES);

  // Group files by high-level category
  const categories = {
    documents: { label: 'Documents & PDFs', bytes: 0, count: 0, color: 'bg-blue-500', icon: FileText },
    images: { label: 'Images & Photos', bytes: 0, count: 0, color: 'bg-purple-500', icon: Image },
    spreadsheets: { label: 'Spreadsheets', bytes: 0, count: 0, color: 'bg-emerald-500', icon: FileSpreadsheet },
    archives: { label: 'Archives & ZIPs', bytes: 0, count: 0, color: 'bg-amber-500', icon: FileArchive },
    code: { label: 'Code & Data', bytes: 0, count: 0, color: 'bg-indigo-500', icon: FileCode },
    other: { label: 'Other Formats', bytes: 0, count: 0, color: 'bg-slate-400', icon: FileQuestion },
  };

  files.forEach((file) => {
    const info = getFileTypeInfo(file.name, file.mimeType);
    const cat = info.category.toLowerCase();
    const size = file.size || 0;

    if (cat.includes('pdf') || cat.includes('word') || cat.includes('text') || cat.includes('presentation')) {
      categories.documents.bytes += size;
      categories.documents.count += 1;
    } else if (cat.includes('image')) {
      categories.images.bytes += size;
      categories.images.count += 1;
    } else if (cat.includes('spreadsheet')) {
      categories.spreadsheets.bytes += size;
      categories.spreadsheets.count += 1;
    } else if (cat.includes('archive')) {
      categories.archives.bytes += size;
      categories.archives.count += 1;
    } else if (cat.includes('code')) {
      categories.code.bytes += size;
      categories.code.count += 1;
    } else {
      categories.other.bytes += size;
      categories.other.count += 1;
    }
  });

  const categoryList = Object.values(categories).filter((c) => c.count > 0);

  return (
    <div className="space-y-6">
      {/* Storage Quota Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Storage Allocation
              </h3>
              <p className="text-xs text-slate-500">
                Student Quota: Exactly 20 MB total per account
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-2xl font-extrabold text-slate-900">
              {formatBytes(totalStorageUsedBytes)}
            </span>
            <span className="text-xs text-slate-400 block font-medium">
              of {formatBytes(TOTAL_QUOTA_BYTES)} used ({usagePercent}%)
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <ProgressBar percentage={usagePercent} size="lg" />

        {/* Warning if nearing full */}
        {usagePercent >= 85 && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Storage running low:</strong> You have {formatBytes(remainingStorageBytes)} remaining. Consider deleting older files before uploading large assignments.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-400 block mb-1">Current Usage</span>
            <span className="text-base font-bold text-slate-900">{formatBytes(totalStorageUsedBytes)}</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-400 block mb-1">Free Storage</span>
            <span className="text-base font-bold text-emerald-600">{formatBytes(remainingStorageBytes)}</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-400 block mb-1">Total Limit</span>
            <span className="text-base font-bold text-slate-900">20.00 MB</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <h4 className="text-sm font-bold text-slate-900 mb-4">
          Storage Breakdown by File Type
        </h4>

        {categoryList.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            No files stored yet. Upload files to see your storage category distribution.
          </p>
        ) : (
          <div className="space-y-3">
            {categoryList.map((cat, idx) => {
              const Icon = cat.icon;
              const catPercent = calculateStoragePercentage(cat.bytes, TOTAL_QUOTA_BYTES);

              return (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white shadow-2xs border border-slate-200/60 text-slate-700">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{cat.label}</p>
                      <p className="text-[11px] text-slate-400">
                        {cat.count} {cat.count === 1 ? 'file' : 'files'} • {catPercent}% of quota
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-800">{formatBytes(cat.bytes)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

