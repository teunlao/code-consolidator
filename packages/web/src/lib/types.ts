// Типы для файлового дерева
export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  selected?: boolean;
  children?: FileNode[];
}

// Типы для фильтрации
export interface FilterSettings {
  ignoredDirectories: string[];
  ignoredFiles: string[];
  ignoredExtensions: string[];
  allowedExtensions: string[];
  useDefaultIgnores: boolean;
}
