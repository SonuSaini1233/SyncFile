import React from 'react';
import { Download, Trash2, Info } from 'lucide-react';
import { FileTypeIcon, getFileTypeInfo } from '../../utils/fileTypeIcons';
import { formatBytes, formatDate } from '../../utils/formatters';

export function FileListItem({ file, onDownload, onDelete, onDetails }) {
  const typeInfo = getFileTypeInfo(file.name, file.mimeType);

  return (
    <div className="group flex items-center justify-between p-3.5 hover:bg-slate-50/80 border-b border-slate-100 last:border-b-0 transition-colors">
      {/* File info */}
      <div
        className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
        onClick={() => onDetails(file)}
      >
        <div className={`p-2.5 rounded-xl ${typeInfo.bgGlow} flex-shrink-0 group-hover:scale-105 transition-transform`}>
          <FileTypeIcon fileName={file.name} mimeType={file.mimeType} className="w-5 h-5" />
        </div>

        <div className="min-w-0 flex-1 pr-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
              {file.name}
            </p>
            <span className={`hidden sm:inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border ${typeInfo.badgeColor}`}>
              {typeInfo.category}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 sm:hidden">
            <span>{formatBytes(file.size)}</span>
            <span>•</span>
            <span>{formatDate(file.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Date & Size (desktop) */}
      <div className="hidden sm:flex items-center gap-8 text-xs text-slate-500 mr-6">
        <span className="w-20 text-right font-medium text-slate-600">
          {formatBytes(file.size)}
        </span>
        <span className="w-24 text-right text-slate-400">
          {formatDate(file.createdAt)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onDetails(file)}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="File details"
          aria-label={`Details for ${file.name}`}
        >
          <Info className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onDownload(file)}
          className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          title="Download file"
          aria-label={`Download ${file.name}`}
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(file)}
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          title="Delete file"
          aria-label={`Delete ${file.name}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

