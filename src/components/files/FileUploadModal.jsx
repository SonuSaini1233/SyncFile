import React, { useState } from 'react';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  RotateCw,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { FileDropzone } from './FileDropzone';
import { useFiles } from '../../context/FileContext';
import { formatBytes } from '../../utils/formatters';
import { FileTypeIcon } from '../../utils/fileTypeIcons';
import { ProgressBar } from '../common/ProgressBar';

export function FileUploadModal({ isOpen, onClose }) {
  const {
    handleUploadFiles,
    activeUploads,
    remainingStorageBytes,
    totalStorageUsedBytes,
  } = useFiles();

  const [selectedLocalFiles, setSelectedLocalFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFilesChosen = (fileList) => {
    setSelectedLocalFiles(Array.from(fileList));
  };

  const handleStartUpload = async () => {
    if (selectedLocalFiles.length === 0) return;
    setIsUploading(true);
    await handleUploadFiles(selectedLocalFiles);
    setSelectedLocalFiles([]);
    setIsUploading(false);
  };

  const handleRemoveStagedFile = (index) => {
    setSelectedLocalFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const stagedTotalBytes = selectedLocalFiles.reduce((acc, f) => acc + f.size, 0);
  const exceedsQuota = stagedTotalBytes > remainingStorageBytes;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isUploading) {
          setSelectedLocalFiles([]);
          onClose();
        }
      }}
      title="Upload Student Files"
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        {/* Dropzone Area */}
        <FileDropzone
          onFilesSelected={handleFilesChosen}
          remainingBytes={remainingStorageBytes}
          disabled={isUploading}
        />

        {/* Selected files awaiting upload */}
        {selectedLocalFiles.length > 0 && (
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Files Ready ({selectedLocalFiles.length})
              </span>
              <span className="text-xs font-medium text-slate-600">
                Total: <strong className="text-slate-900">{formatBytes(stagedTotalBytes)}</strong>
              </span>
            </div>

            {exceedsQuota && (
              <div className="mb-3 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Storage limit exceeded:</strong> Selected files ({formatBytes(stagedTotalBytes)}) exceed your remaining account quota of {formatBytes(remainingStorageBytes)}. Please remove some files.
                </div>
              </div>
            )}

            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {selectedLocalFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200/80 text-sm shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <FileTypeIcon fileName={file.name} mimeType={file.type} className="w-5 h-5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {formatBytes(file.size)}
                      </p>
                    </div>
                  </div>
                  {!isUploading && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStagedFile(idx)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedLocalFiles([])}
                disabled={isUploading}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={handleStartUpload}
                disabled={isUploading || exceedsQuota}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2 transition-all"
              >
                {isUploading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    Start Upload
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Live Active Uploads Queue */}
        {activeUploads.length > 0 && (
          <div className="border border-slate-200 rounded-xl p-4 bg-white">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Upload Progress ({activeUploads.length})
            </h4>
            <div className="space-y-3">
              {activeUploads.map((item) => (
                <div key={item.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-slate-800 truncate max-w-[260px]">
                      {item.name}
                    </span>
                    <span className="text-slate-500">
                      {item.status === 'completed' ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Done
                        </span>
                      ) : item.status === 'error' ? (
                        <span className="text-rose-600 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Failed
                        </span>
                      ) : (
                        `${item.progress}%`
                      )}
                    </span>
                  </div>

                  <ProgressBar
                    percentage={item.progress}
                    size="sm"
                    colorScheme={
                      item.status === 'completed'
                        ? 'emerald'
                        : item.status === 'error'
                        ? 'rose'
                        : 'indigo'
                    }
                  />

                  {item.error && (
                    <p className="text-[11px] text-rose-600 mt-1.5 leading-tight">
                      {item.error}
                    </p>
                  )}

                  {item.status === 'uploading' && item.cancel && (
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={item.cancel}
                        className="text-[11px] text-slate-500 hover:text-rose-600 transition-colors"
                      >
                        Cancel upload
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

