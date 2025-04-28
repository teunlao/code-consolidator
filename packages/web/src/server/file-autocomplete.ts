import { FileNode } from '@/lib/types';
import { buildFileTree, FilterSettings, shouldIgnore } from './file-system';
import * as fs from 'fs';
import * as path from 'path';

// Максимальное количество предложений для автозаполнения
const MAX_SUGGESTIONS = 15;

/**
 * Функция для создания предложений автодополнения для поиска файлов
 * @param query Поисковый запрос
 * @param filterSettings Настройки фильтрации файлов
 * @returns Массив предложений строк для автодополнения
 */
export async function generateFilePathSuggestions(
  query: string, 
  filterSettings?: FilterSettings
): Promise<string[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }
  
  // Преобразуем запрос в нижний регистр для нечувствительного к регистру поиска
  const normalizedQuery = query.toLowerCase();
  
  try {
    // Получаем каталог проекта
    const projectDir = process.env.USER_PROJECT_DIR || process.cwd();
    
    // Получаем дерево файлов проекта с учетом фильтров
    const fileTree = await buildFileTree(projectDir, filterSettings);
    
    // Извлекаем имена файлов и директорий из дерева
    const allPaths = extractPaths(fileTree);
    
    // Фильтруем и сортируем пути, соответствующие запросу
    const matchingPaths = allPaths
      // Фильтрация по соответствию запросу (в имени файла или директории)
      .filter(path => {
        const lastSegment = getLastPathSegment(path);
        return lastSegment.toLowerCase().includes(normalizedQuery);
      })
      // Сортировка: сначала точные совпадения, затем по длине (короткие пути сначала)
      .sort((a, b) => {
        const aLastSegment = getLastPathSegment(a);
        const bLastSegment = getLastPathSegment(b);
        
        // Точные совпадения в начале строки ставим в приоритет
        const aStartsWithQuery = aLastSegment.toLowerCase().startsWith(normalizedQuery);
        const bStartsWithQuery = bLastSegment.toLowerCase().startsWith(normalizedQuery);
        
        if (aStartsWithQuery && !bStartsWithQuery) return -1;
        if (!aStartsWithQuery && bStartsWithQuery) return 1;
        
        // Если оба начинаются или не начинаются с запроса, сортируем по длине
        return a.length - b.length;
      })
      // Ограничиваем количество результатов
      .slice(0, MAX_SUGGESTIONS);
    
    return matchingPaths;
  } catch (error) {
    console.error('Error generating autocomplete suggestions:', error);
    return [];
  }
}

/**
 * Извлекает все пути из дерева файлов
 */
function extractPaths(node: FileNode): string[] {
  let paths: string[] = [];
  
  // Добавляем текущий путь
  paths.push(node.path);
  
  // Рекурсивно обрабатываем дочерние элементы
  if (node.children) {
    node.children.forEach(child => {
      paths = [...paths, ...extractPaths(child)];
    });
  }
  
  return paths;
}

/**
 * Извлекает последний сегмент пути (имя файла или директории)
 */
function getLastPathSegment(path: string): string {
  const segments = path.split('/');
  return segments[segments.length - 1];
}