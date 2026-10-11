import React, { useState } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
  Upload,
  FolderOpen,
  FilterX,
  X,
} from 'lucide-react';
import { useFiles } from '../../context/FileContext';
import { FileListItem } from './FileListItem';
import { FileCard } from './FileCard';
import { FileDetailsModal } from './FileDetailsModal';
import { ConfirmDialog } from '../common/ConfirmDialog';

export function FileList({ onOpenUploadModal }) {
  const {
    files,
    rawFilesCount,
    loadingFiles,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    viewMode,
    setViewMode,
    selectedFileForDetails,
    setSelectedFileForDetails,
    fileToDelete,
    setFileToDelete,
    handleDownloadFile,
    handleDeleteFile,
  } = useFiles();

  const [isDeleting, setIsDeleting] = useState(false);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    await handleDeleteFile(fileToDelete);
    setIsDeleting(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Search, Filter, View Controls Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 bg-white">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by file name..."
            className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort, View Toggle, and Upload CTA */}
        <div className="flex items-center gap-2.5 flex-wrap justify-between md:justify-end">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600">
            <span className="text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-none text-xs font-medium text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="date">Upload Date</option>
              <option value="name">File Name</option>
              <option value="size">File Size</option>
            </select>
            <button
              type="button"
              onClick={toggleSortOrder}
              title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
              className="p-1 text-slate-500 hover:text-indigo-600 rounded-md transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              title="List View"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Upload Button */}
          <button
            type="button"
            onClick={onOpenUploadModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Main Files Area */}
      <div>
        {loadingFiles ? (
          /* Loading Skeleton */
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded-md w-1/3" />
                  <div className="h-3 bg-slate-100 rounded-md w-1/4" />
                </div>
                <div className="w-16 h-4 bg-slate-100 rounded-md" />
              </div>
            ))}
          </div>
        ) : rawFilesCount === 0 ? (
          /* Empty State: No files yet */
          <div className="py-16 px-6 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <FolderOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              No files yet
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mb-6">
              Upload your first file and keep your study materials organized in one place.
            </p>
            <button
              type="button"
              onClick={onOpenUploadModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Upload File
            </button>
          </div>
        ) : files.length === 0 ? (
          /* Search Empty State */
          <div className="py-14 px-6 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <FilterX className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-slate-800 mb-1">
              No matching files found
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              No files matched "{searchQuery}". Try a different keyword.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
            >
              Clear search filter
            </button>
          </div>
        ) : viewMode === 'list' ? (
          /* Table / List View */
          <div>
            {/* Table Header */}
            <div className="hidden sm:flex items-center justify-between px-4 py-2.5 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <span className="flex-1 pl-12">Name</span>
              <div className="flex items-center gap-8 mr-6">
                <span className="w-20 text-right">Size</span>
                <span className="w-24 text-right">Uploaded</span>
              </div>
              <span className="w-28 text-right pr-3">Actions</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-100">
              {files.map((file) => (
                <FileListItem
                  key={file.id}
                  file={file}
                  onDownload={handleDownloadFile}
                  onDelete={(f) => setFileToDelete(f)}
                  onDetails={(f) => setSelectedFileForDetails(f)}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Grid View */
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onDownload={handleDownloadFile}
                onDelete={(f) => setFileToDelete(f)}
                onDetails={(f) => setSelectedFileForDetails(f)}
              />
            ))}
          </div>
        )}
      </div>

      {/* File Details Modal */}
      <FileDetailsModal
        file={selectedFileForDetails}
        isOpen={Boolean(selectedFileForDetails)}
        onClose={() => setSelectedFileForDetails(null)}
        onDownload={handleDownloadFile}
        onDelete={(f) => setFileToDelete(f)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(fileToDelete)}
        onClose={() => setFileToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete File"
        message={`Are you sure you want to permanently delete "${fileToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete File"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
}

