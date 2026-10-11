import React from 'react';
import {
  Download,
  Trash2,
  Calendar,
  HardDrive,
  FileCheck,
  FolderGit2,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { FileTypeIcon, getFileTypeInfo } from '../../utils/fileTypeIcons';
import { formatBytes, formatFullDateTime } from '../../utils/formatters';

export function FileDetailsModal({
  file,
  isOpen,
  onClose,
  onDownload,
  onDelete,
}) {
  if (!file) return null;

  const typeInfo = getFileTypeInfo(file.name, file.mimeType);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="File Details" maxWidth="max-w-md">
      <div>
        {/* Header Icon + File Name */}
        <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100">
          <div className={`p-3 rounded-2xl ${typeInfo.bgGlow} flex-shrink-0`}>
            <FileTypeIcon fileName={file.name} mimeType={file.mimeType} className="w-8 h-8" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-base font-semibold text-slate-900 break-words">
              {file.name}
            </h4>
            <span
              className={`inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${typeInfo.badgeColor}`}
            >
              {typeInfo.category}
            </span>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="py-4 space-y-3.5 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-500">
              <HardDrive className="w-4 h-4 text-slate-400" />
              File Size
            </span>
            <span className="font-semibold text-slate-900">
              {formatBytes(file.size)} <span className="text-slate-400 font-normal">({file.size?.toLocaleString()} bytes)</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-500">
              <Calendar className="w-4 h-4 text-slate-400" />
              Uploaded
            </span>
            <span className="font-medium text-slate-800">
              {formatFullDateTime(file.createdAt)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-500">
              <FileCheck className="w-4 h-4 text-slate-400" />
              MIME Type
            </span>
            <span className="font-mono text-[11px] text-slate-700 truncate max-w-[200px]" title={file.mimeType}>
              {file.mimeType || 'application/octet-stream'}
            </span>
          </div>

          {file.storagePath && (
            <div className="flex items-start justify-between gap-4 pt-1 border-t border-slate-100">
              <span className="flex items-center gap-2 text-slate-500 flex-shrink-0">
                <FolderGit2 className="w-4 h-4 text-slate-400" />
                Storage Path
              </span>
              <span className="font-mono text-[10px] text-slate-500 break-all text-right">
                {file.storagePath}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(file);
            }}
            className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete File
          </button>

          <button
            type="button"
            onClick={() => {
              onDownload(file);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>
    </Modal>
  );
}

