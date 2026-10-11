import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  Image,
  Film,
  Music,
  FileQuestion,
  Presentation,
  FileBox,
} from 'lucide-react';

/**
 * Determine category and icon metadata based on MIME type and file extension
 * @param {string} fileName 
 * @param {string} mimeType 
 */
export function getFileTypeInfo(fileName = '', mimeType = '') {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  // PDF
  if (ext === 'pdf' || mimeType === 'application/pdf') {
    return {
      category: 'PDF Document',
      badgeColor: 'bg-red-50 text-red-700 border-red-200',
      iconColor: 'text-red-500',
      bgGlow: 'bg-red-50',
      Icon: FileText,
    };
  }

  // Word / Text Documents
  if (
    ['doc', 'docx', 'odt', 'rtf', 'pages'].includes(ext) ||
    mimeType.includes('word') ||
    mimeType.includes('officedocument.wordprocessingml')
  ) {
    return {
      category: 'Word Document',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      iconColor: 'text-blue-500',
      bgGlow: 'bg-blue-50',
      Icon: FileText,
    };
  }

  // Plain Text / Markdown
  if (['txt', 'md', 'log'].includes(ext) || mimeType.startsWith('text/plain')) {
    return {
      category: 'Text File',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      iconColor: 'text-slate-600',
      bgGlow: 'bg-slate-100',
      Icon: FileText,
    };
  }

  // Excel / Spreadsheets
  if (
    ['xls', 'xlsx', 'csv', 'ods', 'numbers'].includes(ext) ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    mimeType === 'text/csv'
  ) {
    return {
      category: 'Spreadsheet',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconColor: 'text-emerald-500',
      bgGlow: 'bg-emerald-50',
      Icon: FileSpreadsheet,
    };
  }

  // PowerPoint / Presentations
  if (
    ['ppt', 'pptx', 'odp', 'key'].includes(ext) ||
    mimeType.includes('presentation') ||
    mimeType.includes('powerpoint')
  ) {
    return {
      category: 'Presentation',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      iconColor: 'text-amber-500',
      bgGlow: 'bg-amber-50',
      Icon: Presentation,
    };
  }

  // Images
  if (
    ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'ico', 'avif'].includes(ext) ||
    mimeType.startsWith('image/')
  ) {
    return {
      category: 'Image',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      iconColor: 'text-purple-500',
      bgGlow: 'bg-purple-50',
      Icon: Image,
    };
  }

  // Archives / Compressed
  if (
    ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext) ||
    mimeType.includes('zip') ||
    mimeType.includes('compressed') ||
    mimeType.includes('tar')
  ) {
    return {
      category: 'Archive',
      badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
      iconColor: 'text-orange-500',
      bgGlow: 'bg-orange-50',
      Icon: FileArchive,
    };
  }

  // Video
  if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv'].includes(ext) || mimeType.startsWith('video/')) {
    return {
      category: 'Video',
      badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      iconColor: 'text-cyan-500',
      bgGlow: 'bg-cyan-50',
      Icon: Film,
    };
  }

  // Audio
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext) || mimeType.startsWith('audio/')) {
    return {
      category: 'Audio',
      badgeColor: 'bg-pink-50 text-pink-700 border-pink-200',
      iconColor: 'text-pink-500',
      bgGlow: 'bg-pink-50',
      Icon: Music,
    };
  }

  // Code / Programming
  if (
    ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'java', 'c', 'cpp', 'rs', 'go', 'php', 'sql', 'sh'].includes(ext) ||
    mimeType.includes('json') ||
    mimeType.includes('javascript') ||
    mimeType.includes('html')
  ) {
    return {
      category: 'Code File',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      iconColor: 'text-indigo-500',
      bgGlow: 'bg-indigo-50',
      Icon: FileCode,
    };
  }

  // Fallback Generic
  return {
    category: ext ? `${ext.toUpperCase()} File` : 'File',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    iconColor: 'text-slate-500',
    bgGlow: 'bg-slate-50',
    Icon: FileQuestion,
  };
}

/**
 * Render appropriate file type icon with proper sizing and styling
 */
export function FileTypeIcon({ fileName, mimeType, className = 'w-6 h-6' }) {
  const { Icon, iconColor } = getFileTypeInfo(fileName, mimeType);
  return <Icon className={`${className} ${iconColor} flex-shrink-0`} aria-hidden="true" />;
}

