import { FileNode } from './types';

/**
 * Находит ноду в дереве, наиболее соответствующую указанному пути
 * 
 * @param tree Дерево файлов
 * @param targetPath Путь к искомому файлу или директории
 * @returns {FileNode | null} Найденный узел или null, если не найден
 */
export function findNodeByPath(tree: FileNode, targetPath: string): FileNode | null {
  // Проверяем точное совпадение
  if (tree.path === targetPath) {
    return tree;
  }
  
  // Если это не точное совпадение, но есть дети - проверяем их
  if (tree.children) {
    for (const child of tree.children) {
      const result = findNodeByPath(child, targetPath);
      if (result) {
        return result;
      }
    }
  }
  
  // Если мы не нашли точное совпадение, можно попробовать более гибкий поиск
  // Например, проверить, содержится ли targetPath в tree.path или наоборот
  if (targetPath.includes(tree.path) || tree.path.includes(targetPath)) {
    // Если это директория или абсолютный путь содержит относительный
    return tree;
  }
  
  return null;
}

/**
 * Выбирает ноду и все её дочерние элементы (для директорий)
 */
export function selectNodeAndChildren(tree: FileNode, node: FileNode, selected: boolean): FileNode {
  if (tree.path === node.path) {
    // Создаем новую копию узла для гарантии обновления состояния
    const updatedNode = { ...tree, selected };
    
    // Если это директория, выбираем все дочерние элементы
    if (tree.type === 'directory' && tree.children) {
      updatedNode.children = tree.children.map(child => {
        // Создаем новый дочерний узел с установленным флагом selected
        const newChild = { ...child, selected };
        
        // Если у дочернего узла есть свои дети, рекурсивно обрабатываем их
        if (newChild.children) {
          return {
            ...newChild,
            children: newChild.children.map(grandchild => 
              selectNodeAndChildren(grandchild, grandchild, selected)
            )
          };
        }
        
        return newChild;
      });
    }
    
    return updatedNode;
  }
  
  // Рекурсивный обход для поиска нужного узла
  if (tree.children) {
    return {
      ...tree, // Копируем текущий узел
      children: tree.children.map(child => selectNodeAndChildren(child, node, selected))
    };
  }
  
  return tree;
}
