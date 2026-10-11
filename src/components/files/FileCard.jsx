import React from 'react';
import { Download, Trash2, Info } from 'lucide-react';
import { FileTypeIcon, getFileTypeInfo } from '../../utils/fileTypeIcons';
import { formatBytes, formatDate } from '../../utils/formatters';

export function FileCard({ file, onDownload, onDelete, onDetails }) {
  const typeInfo = getFileTypeInfo(file.name, file.mimeType);

  return (
    <div className="group relative bg-white border border-slate-200/90 rounded-2xl p-4.5 hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex flex-col justify-between">
      {/* Top row: icon and badges */}
      <div>
        <div className="flex items-start justify-between mb-3.5">
          <div
            className={`p-3 rounded-2xl ${typeInfo.bgGlow} cursor-pointer group-hover:scale-105 transition-transform`}
            onClick={() => onDetails(file)}
          >
            <FileTypeIcon fileName={file.name} mimeType={file.mimeType} className="w-6 h-6" />
          </div>

          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${typeInfo.badgeColor}`}>
            {typeInfo.category}
          </span>
        </div>

        {/* File name */}
        <h4
          className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug cursor-pointer group-hover:text-indigo-600 transition-colors mb-2 break-all"
          title={file.name}
          onClick={() => onDetails(file)}
        >
          {file.name}
        </h4>
      </div>

      {/* Bottom row: metadata and actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
        <div className="text-[11px] text-slate-400">
          <p className="font-medium text-slate-600">{formatBytes(file.size)}</p>
          <p>{formatDate(file.createdAt)}</p>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onDetails(file)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="File details"
            aria-label={`Details for ${file.name}`}
          >
            <Info className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDownload(file)}
            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Download file"
            aria-label={`Download ${file.name}`}
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(file)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete file"
            aria-label={`Delete ${file.name}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

