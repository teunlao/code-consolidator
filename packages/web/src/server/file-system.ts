import * as fs from 'fs';
import * as path from 'path';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
  selected?: boolean;
}

export interface FilterSettings {
  ignoredDirectories: string[];
  ignoredFiles: string[];
  ignoredExtensions: string[];
  allowedExtensions: string[];
  useDefaultIgnores: boolean;
}

// Стандартные списки игнорируемых элементов
const DEFAULT_IGNORED_DIRECTORIES = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'tmp',
  'coverage',
  'nx',
  '.nx',
  '.next',
  '.nuxt',
];

const DEFAULT_IGNORED_FILES = [
  '.DS_Store',
  '*.log',
  '*.tmp',
  '*.swp',
  'yarn.lock',
  'package-lock.json',
  'pnpm-lock.yaml',
  'project_files.ts',
  'out.gen.pdf',
  'project_code.txt',
  'project_code.pdf',
  'out.gen.txt',
];

const DEFAULT_IGNORED_EXTENSIONS = [
  '.old',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.bmp',
  '.ico',
  '.webp',
  '.tiff',
  '.pdf',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.zip',
  '.tar',
  '.gz',
  '.rar',
  '.7z',
  '.mp3',
  '.mp4',
  '.avi',
  '.mov',
  '.wmv',
  '.flv',
  '.ttf',
  '.woff',
  '.woff2',
  '.eot',
  '.pdf',
];

// Проверка нужно ли игнорировать файл/директорию
export function shouldIgnore(filePath: string, stats: fs.Stats, settings?: FilterSettings): boolean {
  const baseName = path.basename(filePath);
  const ext = path.extname(baseName).toLowerCase();
  
  // Формируем списки файлов и директорий для игнорирования на основе настроек
  const ignoredDirs = settings?.useDefaultIgnores 
    ? [...DEFAULT_IGNORED_DIRECTORIES, ...(settings?.ignoredDirectories || [])]
    : settings?.ignoredDirectories || [];
    
  const ignoredFiles = settings?.useDefaultIgnores
    ? [...DEFAULT_IGNORED_FILES, ...(settings?.ignoredFiles || [])]
    : settings?.ignoredFiles || [];
    
  const ignoredExts = settings?.useDefaultIgnores
    ? [...DEFAULT_IGNORED_EXTENSIONS, ...(settings?.ignoredExtensions || [])]
    : settings?.ignoredExtensions || [];
    
  const allowedExts = settings?.allowedExtensions || [];
  
  // Проверяем директории
  if (stats.isDirectory() && ignoredDirs.includes(baseName)) {
    return true;
  }
  
  // Проверяем файлы
  if (stats.isFile()) {
    // Проверяем по имени файла
    if (ignoredFiles.includes(baseName)) {
      return true;
    }
    
    // Проверяем по шаблонам файлов
    for (const pattern of ignoredFiles) {
      if (pattern.includes('*') && 
          new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\./g, '\\.') + '$').test(baseName)) {
        return true;
      }
    }
    
    // Проверяем по расширению
    if (ignoredExts.includes(ext)) {
      return true;
    }
    
    // Если указаны разрешенные расширения, проверяем, входит ли файл в этот список
    if (allowedExts.length > 0 && !allowedExts.includes(ext)) {
      return true;
    }
  }
  
  return false;
}

// Получение размера файла
export function getFileSize(filePath: string): number {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    console.error(`Error getting file size for ${filePath}:`, error);
    return 0;
  }
}

// Построение дерева файлов
export async function buildFileTree(dirPath: string, settings?: FilterSettings): Promise<FileNode> {
  try {
    const stats = fs.statSync(dirPath);
    const name = path.basename(dirPath);
    
    if (stats.isFile()) {
      return {
        name,
        path: dirPath,
        type: 'file',
        size: stats.size,
        selected: false
      };
    }
    
    if (stats.isDirectory()) {
      const children: FileNode[] = [];
      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const fileStats = fs.statSync(filePath);
        
        if (!shouldIgnore(filePath, fileStats, settings)) {
          try {
            const node = await buildFileTree(filePath, settings);
            children.push(node);
          } catch (error) {
            console.error(`Error processing ${filePath}:`, error);
          }
        }
      }
      
      // Сортируем: сначала папки, потом файлы, по алфавиту
      children.sort((a, b) => {
        if (a.type === 'directory' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
      });
      
      return {
        name,
        path: dirPath,
        type: 'directory',
        children,
        selected: false
      };
    }
    
    throw new Error(`Unknown file type for ${dirPath}`);
  } catch (error) {
    console.error(`Error building file tree for ${dirPath}:`, error);
    throw error;
  }
}

// Форматирование размера файла
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}