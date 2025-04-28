// Типы данных, используемые как на клиенте, так и на сервере

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
  selected: boolean;
}