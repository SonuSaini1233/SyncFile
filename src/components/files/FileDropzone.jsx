import React, { useState, useRef } from 'react';
import { UploadCloud, FileUp, AlertCircle } from 'lucide-react';
import { formatBytes } from '../../utils/formatters';

export function FileDropzone({ onFilesSelected, remainingBytes = 20 * 1024 * 1024, disabled = false }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleBrowseClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
      // Reset input value so identical file can be selected again if needed
      e.target.value = '';
    }
  };

  const isQuotaFull = remainingBytes <= 0;

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleBrowseClick}
      className={`relative group rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer ${
        isQuotaFull || disabled
          ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-75'
          : isDragOver
          ? 'border-indigo-600 bg-indigo-50/50 scale-[1.005]'
          : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/60 bg-white'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled || isQuotaFull}
      />

      <div className="flex flex-col items-center">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110 ${
            isQuotaFull
              ? 'bg-rose-50 text-rose-500'
              : isDragOver
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-indigo-50 text-indigo-600'
          }`}
        >
          {isQuotaFull ? (
            <AlertCircle className="w-7 h-7" />
          ) : isDragOver ? (
            <FileUp className="w-7 h-7 animate-bounce" />
          ) : (
            <UploadCloud className="w-7 h-7" />
          )}
        </div>

        {isQuotaFull ? (
          <div>
            <h4 className="text-base font-semibold text-slate-800">
              Storage Quota Full (20 MB Reached)
            </h4>
            <p className="text-sm text-rose-600 mt-1">
              Delete some files to free up space before uploading new ones.
            </p>
          </div>
        ) : (
          <div>
            <h4 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Drag & drop student files here, or <span className="text-indigo-600 underline decoration-indigo-300 underline-offset-2">browse</span>
            </h4>
            <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto">
              Supports PDF, DOCX, PPTX, XLSX, TXT, Images, and ZIP. Up to 20 MB max file size.
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
              <span>Remaining storage:</span>
              <strong className="text-slate-800">{formatBytes(remainingBytes)}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

