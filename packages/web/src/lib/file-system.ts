import * as fs from 'fs';
import * as path from 'path';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
  selected?: boolean;
}

// Список игнорируемых директорий и файлов
const ignoredDirectories = [
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

const ignoredFiles = [
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

const ignoredExtensions = [
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
function shouldIgnore(filePath: string, stats: fs.Stats): boolean {
  const baseName = path.basename(filePath);
  
  if (stats.isDirectory() && ignoredDirectories.includes(baseName)) {
    return true;
  }
  
  if (stats.isFile()) {
    if (ignoredFiles.includes(baseName)) {
      return true;
    }
    
    for (const pattern of ignoredFiles) {
      if (pattern.includes('*') && 
          new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\./g, '\\.') + '$').test(baseName)) {
        return true;
      }
    }
    
    const ext = path.extname(baseName).toLowerCase();
    if (ignoredExtensions.includes(ext)) {
      return true;
    }
  }
  
  return false;
}

// Получение размера файла
function getFileSize(filePath: string): number {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    console.error(`Error getting file size for ${filePath}:`, error);
    return 0;
  }
}

// Построение дерева файлов
export async function buildFileTree(dirPath: string): Promise<FileNode> {
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
        
        if (!shouldIgnore(filePath, fileStats)) {
          try {
            const node = await buildFileTree(filePath);
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

// Функция для получения всех выбранных файлов из дерева
export function getSelectedFiles(node: FileNode): string[] {
  let selected: string[] = [];
  
  if (node.selected && node.type === 'file') {
    selected.push(node.path);
  }
  
  if (node.children) {
    for (const child of node.children) {
      selected = selected.concat(getSelectedFiles(child));
    }
  }
  
  return selected;
}

// Получить общий контент файла с указанием пути
export function getFileContent(filePath: string, includeComments: boolean = true): string {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    if (!includeComments) {
      // Удаляем комментарии
      content = content
        .replace(/\/\/.*$/gm, '') // Однострочные комментарии
        .replace(/\/\*[\s\S]*?\*\//g, '') // Многострочные комментарии
        .replace(/^\s*[\r\n]/gm, ''); // Пустые строки
    }
    
    return content;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return '';
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
