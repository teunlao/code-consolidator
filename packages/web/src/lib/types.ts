// Типы данных, используемые как на клиенте, так и на сервере

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
  selected: boolean;
}

export interface FilterSettings {
  ignoredDirectories: string[];
  ignoredFiles: string[];
  ignoredExtensions: string[];
  allowedExtensions: string[];
  useDefaultIgnores: boolean;
}