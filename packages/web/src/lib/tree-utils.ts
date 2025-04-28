import { FileNode } from './types';

// Функция для обновления выбранных файлов в дереве
export function updateNodeSelection(tree: FileNode, path: string, selected: boolean): FileNode {
  if (tree.path === path) {
    // Если это директория, обновляем все дочерние элементы
    if (tree.type === 'directory' && tree.children) {
      return {
        ...tree,
        selected,
        children: tree.children.map(child => ({
          ...child,
          selected,
          children: child.children 
            ? child.children.map(grandchild => updateNodeSelection({ 
                ...grandchild, 
                selected 
              }, grandchild.path, selected))
            : undefined
        }))
      };
    }
    
    // Если это файл, просто обновляем его статус
    return { ...tree, selected };
  }
  
  // Если это не искомый узел, но у него есть дети
  if (tree.children) {
    return {
      ...tree,
      children: tree.children.map(child => updateNodeSelection(child, path, selected))
    };
  }
  
  return tree;
}

// Функция для получения путей выбранных файлов
export function getSelectedFilePaths(node: FileNode): string[] {
  let paths: string[] = [];
  
  if (node.type === 'file' && node.selected) {
    paths.push(node.path);
  }
  
  if (node.children) {
    node.children.forEach(child => {
      paths = [...paths, ...getSelectedFilePaths(child)];
    });
  }
  
  return paths;
}

// Функция для подсчета выбранных файлов в дереве
export function countSelectedFiles(node: FileNode): number {
  let count = node.type === 'file' && node.selected ? 1 : 0;
  
  if (node.children) {
    count += node.children.reduce((acc, child) => acc + countSelectedFiles(child), 0);
  }
  
  return count;
}
