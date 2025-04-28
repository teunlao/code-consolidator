'use client';

// Форматирование размера файла
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Стандартные списки игнорируемых элементов для отображения в UI
export const DEFAULT_IGNORED_DIRECTORIES = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'tmp',
  'coverage',
  '.next',
  '.nuxt',
];

export const DEFAULT_IGNORED_FILES = [
  '.DS_Store',
  '*.log',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
];

export const DEFAULT_IGNORED_EXTENSIONS = [
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.bmp',
  '.ico',
  '.pdf',
  '.exe',
  '.zip',
];

// Получение расширения файла для отображения
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 1);
}