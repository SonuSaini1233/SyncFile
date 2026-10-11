import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import {
  uploadFileToStorage,
  downloadFileSecurely,
  deleteFileFromStorage,
  subscribeToUserFiles,
} from '../services/fileService';
import { validateFileUpload } from '../utils/securityValidators';
import { TOTAL_QUOTA_BYTES, formatBytes } from '../utils/formatters';

const FileContext = createContext(null);

export function FileProvider({ children }) {
  const { user, userProfile, updateLocalQuota, isConfigured } = useAuth();
  const toast = useToast();

  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'name' | 'size'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [activeUploads, setActiveUploads] = useState([]);
  const [selectedFileForDetails, setSelectedFileForDetails] = useState(null);
  const [fileToDelete, setFileToDelete] = useState(null);

  // Load sample student files if running in demo preview mode
  useEffect(() => {
    if (!user) {
      setFiles([]);
      setLoadingFiles(false);
      return;
    }

    if (!isConfigured) {
      // Demo preview files for instant interactive testing
      const savedDemoFiles = sessionStorage.getItem(`syncfile_demo_files_${user.uid}`);
      if (savedDemoFiles) {
        try {
          setFiles(JSON.parse(savedDemoFiles));
        } catch (e) {
          console.warn('Failed parsing demo files', e);
        }
      } else {
        const sampleFiles = [
          {
            id: 'demo-1',
            name: 'CS101_Lecture_Notes_Week_4.pdf',
            size: 2450000,
            mimeType: 'application/pdf',
            createdAt: new Date(Date.now() - 3600000 * 2),
            ownerUid: user.uid,
            storagePath: `users/${user.uid}/files/demo-1/CS101_Lecture_Notes_Week_4.pdf`,
          },
          {
            id: 'demo-2',
            name: 'Biology_Lab_Report_Final.docx',
            size: 1150000,
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            createdAt: new Date(Date.now() - 3600000 * 24),
            ownerUid: user.uid,
            storagePath: `users/${user.uid}/files/demo-2/Biology_Lab_Report_Final.docx`,
          },
          {
            id: 'demo-3',
            name: 'Calculus_Exam_Formula_Sheet.png',
            size: 850000,
            mimeType: 'image/png',
            createdAt: new Date(Date.now() - 3600000 * 48),
            ownerUid: user.uid,
            storagePath: `users/${user.uid}/files/demo-3/Calculus_Exam_Formula_Sheet.png`,
          },
          {
            id: 'demo-4',
            name: 'Machine_Learning_Dataset.csv',
            size: 792880,
            mimeType: 'text/csv',
            createdAt: new Date(Date.now() - 3600000 * 72),
            ownerUid: user.uid,
            storagePath: `users/${user.uid}/files/demo-4/Machine_Learning_Dataset.csv`,
          },
        ];
        setFiles(sampleFiles);
        try {
          sessionStorage.setItem(`syncfile_demo_files_${user.uid}`, JSON.stringify(sampleFiles));
        } catch (e) {}
      }
      setLoadingFiles(false);
      return;
    }

    // Real Firebase: subscribe to real-time updates from Cloud Firestore
    setLoadingFiles(true);
    const unsubscribe = subscribeToUserFiles(
      user.uid,
      (fetchedFiles) => {
        setFiles(fetchedFiles);
        setLoadingFiles(false);
      },
      (error) => {
        console.error('Error in files subscription:', error);
        toast.error('Could not synchronize file list with cloud.');
        setLoadingFiles(false);
      }
    );

    return () => unsubscribe();
  }, [user, isConfigured]);

  // Save demo files to sessionStorage whenever they change
  useEffect(() => {
    if (!isConfigured && user) {
      try {
        sessionStorage.setItem(`syncfile_demo_files_${user.uid}`, JSON.stringify(files));
        const total = files.reduce((acc, f) => acc + (f.size || 0), 0);
        updateLocalQuota(total);
      } catch (e) {}
    }
  }, [files, isConfigured, user]);

  // Current used storage in bytes
  const totalStorageUsedBytes = useMemo(() => {
    if (userProfile && typeof userProfile.totalStorageUsedBytes === 'number') {
      return userProfile.totalStorageUsedBytes;
    }
    // Fallback: sum of all loaded file sizes
    return files.reduce((acc, f) => acc + (f.size || 0), 0);
  }, [userProfile, files]);

  // Remaining storage in bytes
  const remainingStorageBytes = useMemo(() => {
    return Math.max(0, TOTAL_QUOTA_BYTES - totalStorageUsedBytes);
  }, [totalStorageUsedBytes]);

  /**
   * Handle uploading one or more files
   * @param {FileList | File[]} fileList 
   */
  const handleUploadFiles = async (fileList) => {
    if (!user) {
      toast.error('You must be signed in to upload files.');
      return;
    }

    const filesArray = Array.from(fileList);
    if (filesArray.length === 0) return;

    // Check combined size of incoming batch against remaining quota
    const incomingBatchBytes = filesArray.reduce((acc, f) => acc + f.size, 0);
    if (incomingBatchBytes > remainingStorageBytes) {
      toast.error(
        `Not enough storage available. Delete a file to free up space. Selected files total ${formatBytes(incomingBatchBytes)}, but you only have ${formatBytes(remainingStorageBytes)} left.`
      );
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const file of filesArray) {
      // Validate individual file
      const validation = validateFileUpload(file, totalStorageUsedBytes);
      if (!validation.valid) {
        toast.error(validation.error);
        failCount++;
        continue;
      }

      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const controls = { cancel: () => {} };

      // Add to active uploads queue
      setActiveUploads((prev) => [
        ...prev,
        {
          id: uploadId,
          name: file.name,
          size: file.size,
          progress: 0,
          status: 'uploading',
          cancel: () => controls.cancel(),
        },
      ]);

      try {
        const uploadedFile = await uploadFileToStorage(
          file,
          user.uid,
          (progress) => {
            setActiveUploads((prev) =>
              prev.map((item) =>
                item.id === uploadId ? { ...item, progress } : item
              )
            );
          },
          controls
        );

        // Success state
        setActiveUploads((prev) =>
          prev.map((item) =>
            item.id === uploadId ? { ...item, status: 'completed', progress: 100 } : item
          )
        );

        if (!isConfigured) {
          setFiles((prev) => [uploadedFile, ...prev]);
        }

        successCount++;
        toast.success(`"${file.name}" uploaded successfully!`);

        // Automatically remove completed item from active uploads after 3.5s
        setTimeout(() => {
          setActiveUploads((prev) => prev.filter((item) => item.id !== uploadId));
        }, 3500);
      } catch (err) {
        console.error('File upload error:', err);
        const errMsg = err.message || 'Upload failed.';
        failCount++;

        setActiveUploads((prev) =>
          prev.map((item) =>
            item.id === uploadId
              ? { ...item, status: 'error', error: errMsg }
              : item
          )
        );

        toast.error(`Failed to upload "${file.name}": ${errMsg}`);
      }
    }

    return { successCount, failCount };
  };

  /**
   * Securely download file
   * @param {object} file 
   */
  const handleDownloadFile = async (file) => {
    try {
      toast.info(`Preparing "${file.name}" for download...`, 2000);
      await downloadFileSecurely(file);
      toast.success(`Downloaded "${file.name}"`);
    } catch (err) {
      console.error('Download error:', err);
      toast.error(`Download failed: ${err.message}`);
    }
  };

  /**
   * Delete file from Cloud Storage & Firestore
   * @param {object} file 
   */
  const handleDeleteFile = async (file) => {
    if (!user || !file) return;

    try {
      await deleteFileFromStorage(file, user.uid);

      if (!isConfigured) {
        setFiles((prev) => prev.filter((f) => f.id !== file.id));
      }

      toast.success(`"${file.name}" was permanently deleted.`);
      setFileToDelete(null);
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(`Failed to delete "${file.name}": ${err.message}`);
    }
  };

  /**
   * Filter and sort files
   */
  const processedFiles = useMemo(() => {
    let result = [...files];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((file) =>
        file.name.toLowerCase().includes(q)
      );
    }

    // Sort files
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      } else if (sortBy === 'size') {
        comparison = (a.size || 0) - (b.size || 0);
      } else if (sortBy === 'date') {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        comparison = dateA - dateB;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [files, searchQuery, sortBy, sortOrder]);

  return (
    <FileContext.Provider
      value={{
        files: processedFiles,
        rawFilesCount: files.length,
        loadingFiles,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
        viewMode,
        setViewMode,
        activeUploads,
        totalStorageUsedBytes,
        remainingStorageBytes,
        selectedFileForDetails,
        setSelectedFileForDetails,
        fileToDelete,
        setFileToDelete,
        handleUploadFiles,
        handleDownloadFile,
        handleDeleteFile,
      }}
    >
      {children}
    </FileContext.Provider>
  );
}

export function useFiles() {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error('useFiles must be used within a FileProvider');
  }
  return context;
}

