'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { formatFileSize } from '@/lib/format-utils';
import type { FileNode } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, File, Folder } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { CodeViewer } from './code-viewer';

interface FileTreeProps {
  data: FileNode;
  onSelect: (path: string, selected: boolean) => void;
  searchQuery?: string; // Добавляем опциональный параметр поискового запроса
}

export function FileTree({ data, onSelect, searchQuery }: FileTreeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [codeViewerOpen, setCodeViewerOpen] = useState<boolean>(false);
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);

  // Константа для ограничения количества результатов поиска,
  // при котором папки будут автоматически раскрываться
  const AUTO_EXPAND_THRESHOLD = 10;

  const toggleExpand = (path: string) => {
    setExpanded((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  // Функция для подсчета количества совпадений в дереве
  const countSearchMatches = (node: FileNode, query: string): number => {
    // Если нет запроса, возвращаем 0
    if (!query) return 0;

    let count = 0;

    // Проверяем, совпадает ли имя текущего узла с запросом
    if (node.name.toLowerCase().includes(query.toLowerCase())) {
      count++;
    }

    // Рекурсивно проверяем все дочерние узлы
    if (node.children) {
      node.children.forEach((child) => {
        count += countSearchMatches(child, query);
      });
    }

    return count;
  };

  // Функция для раскрытия папок с совпадениями
  const expandMatchingFolders = (node: FileNode, query: string, paths: string[] = []): string[] => {
    // Если нет запроса или узел - не папка, или у него нет детей, просто возвращаем текущие пути
    if (!query || node.type !== 'directory' || !node.children) return paths;

    // Проверяем, есть ли совпадения среди дочерних элементов
    let hasMatches = false;

    for (const child of node.children) {
      // Проверяем совпадение имени
      if (child.name.toLowerCase().includes(query.toLowerCase())) {
        hasMatches = true;
      }

      // Проверяем детей рекурсивно и добавляем их пути
      if (child.type === 'directory' && child.children) {
        const childPaths = expandMatchingFolders(child, query, []);
        if (childPaths.length > 0) {
          hasMatches = true;
          paths = [...paths, ...childPaths];
        }
      }
    }

    // Если есть совпадения, добавляем текущий путь в список путей для раскрытия
    if (hasMatches) {
      paths.push(node.path);
    }

    return paths;
  };

  const handleSelectChange = (node: FileNode, checked: boolean) => {
    onSelect(node.path, checked);
  };

  // Очистка таймера при размонтировании компонента
  useEffect(() => {
    return () => {
      if (clickTimer) {
        clearTimeout(clickTimer);
      }
    };
  }, [clickTimer]);

  // Эффект для автоматического раскрытия папок при поиске
  useEffect(() => {
    // Если нет поискового запроса или он слишком короткий, очищаем раскрытые папки
    if (!searchQuery || searchQuery.trim().length < 2) {
      return;
    }

    // Подсчитываем количество совпадений
    const matchesCount = countSearchMatches(data, searchQuery);

    // Если совпадений слишком много, не раскрываем папки автоматически
    if (matchesCount > AUTO_EXPAND_THRESHOLD) {
      console.log(
        `Найдено ${matchesCount} совпадений, превышен порог автоматического раскрытия (${AUTO_EXPAND_THRESHOLD})`,
      );
      return;
    }

    // Получаем пути папок, которые нужно раскрыть
    const pathsToExpand = expandMatchingFolders(data, searchQuery);

    // Обновляем состояние раскрытых папок
    if (pathsToExpand.length > 0) {
      setExpanded((prev) => {
        const newExpanded = { ...prev };
        pathsToExpand.forEach((path) => {
          newExpanded[path] = true;
        });
        return newExpanded;
      });
    }
  }, [searchQuery, data]);

  // Функция для расчета размера папки, суммируя размеры всех файлов внутри
  const calculateDirectorySize = (node: FileNode): number => {
    if (node.type === 'file') {
      return node.size || 0;
    }

    if (!node.children || node.children.length === 0) {
      return 0;
    }

    return node.children.reduce((acc, child) => {
      return acc + calculateDirectorySize(child);
    }, 0);
  };

  const renderNode = (node: FileNode, depth = 0, isLastChild = false, parentIsLast: boolean[] = []) => {
    const isExpanded = expanded[node.path];
    const hasChildren = Boolean(node.children && node.children.length > 0);
    // Рассчитываем размер для директорий
    const directorySize = node.type === 'directory' ? calculateDirectorySize(node) : undefined;

    // Создаем индикаторы вложенности (вертикальные линии)
    const renderTreeLines = () => {
      if (depth === 0) return null;

      return (
        <div className="absolute left-0 top-0 bottom-0" style={{ width: `${(depth + 1) * 12}px` }}>
          {parentIsLast.map(
            (isLast, index) =>
              !isLast &&
              index > 0 && (
                <div
                  key={index}
                  className="absolute border-l border-gray-700"
                  style={{
                    left: `${(index) * 12 + 6}px`,
                    top: 0,
                    bottom: 0,
                  }}
                />
              ),
          )}
          {depth > 0 && (
            <div
              className={`absolute h-1/2 border-l border-gray-700 ${isLastChild ? 'bottom-1/2' : ''}`}
              style={{
                left: `${depth * 12 + 6}px`,
                top: 0,
                bottom: isLastChild ? undefined : 0,
              }}
            />
          )}
          {depth > 0 && (
            <div
              className="absolute border-t border-gray-700"
              style={{
                left: `${depth * 12 + 6}px`,
                width: '6px',
                top: '50%',
              }}
            />
          )}
        </div>
      );
    };

    return (
      <div key={node.path} className="relative">
        {renderTreeLines()}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
        <div
          className={cn(
            'flex items-center py-1 hover:bg-gray-700/70 rounded-sm px-2 cursor-pointer z-10 relative transition-colors duration-200',
            node.selected && 'bg-blue-800/20 border-l-2 border-blue-400',
            depth === 0 && 'mt-1',
            node.type === 'directory' && 'font-medium',
            node.type === 'file' && node.selected && 'text-blue-100',
          )}
          style={{ paddingLeft: `${(depth + 1) * 12 + 4}px` }}
          onClick={(e) => {
            // Проверяем, является ли целевой элемент чекбоксом или его контейнером
            const isCheckboxClick =
              (e.target as HTMLElement).getAttribute('role') === 'checkbox' ||
              (e.target as HTMLElement).closest('[role="checkbox"]') ||
              (e.target as HTMLElement).closest('button');

            // Если клик был на чекбоксе или внутри контейнера чекбокса, игнорируем клик
            if (isCheckboxClick) {
              return;
            }

            // Если клик на папке - разворачиваем/сворачиваем сразу
            if (node.type === 'directory') {
              toggleExpand(node.path);
              return;
            }

            // Если клик на файле - используем таймер для обработки
            if (node.type === 'file') {
              // Если есть активный таймер, очищаем его
              if (clickTimer) {
                clearTimeout(clickTimer);
              }

              // Устанавливаем новый таймер, захватывая текущий node
              const timer = setTimeout(() => {
                // Этот код выполнится, если не было второго клика
                // Используем node из замыкания вместо clickedNode
                handleSelectChange(node, !node.selected);
                setClickTimer(null);
              }, 250); // 250ms задержка

              setClickTimer(timer);
            }
          }}
          onDoubleClick={() => {
            if (node.type === 'file') {
              // Очищаем таймер одиночного клика, чтобы чекбокс не переключился
              if (clickTimer) {
                clearTimeout(clickTimer);
                setClickTimer(null);
              }

              // Открываем просмотр файла
              handleDoubleClick(node);
            }
          }}
        >
          <div
            onClick={(e) => {
              e.stopPropagation(); // Останавливаем всплытие события клика
            }}
            onDoubleClick={(e) => {
              e.stopPropagation(); // Останавливаем всплытие события двойного клика
            }}
            className="cursor-pointer"
          >
            <Checkbox
              id={node.path}
              checked={node.selected}
              onCheckedChange={(checked: boolean | 'indeterminate') => handleSelectChange(node, checked === true)}
              className="mr-2 border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
          </div>

          {/* Фиксированная область для стрелок, всегда одинаковой ширины */}
          <div className="w-4 h-4 mr-2 flex items-center justify-center flex-shrink-0">
            {node.type === 'directory' &&
              hasChildren &&
              (isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              ))}
          </div>

          {/* Фиксированная область для иконок файлов/папок */}
          <div className="w-5 h-4 flex items-center justify-center flex-shrink-0 mr-2">
            {node.type === 'directory' ? (
              <Folder className="h-4 w-4 text-blue-400" />
            ) : (
              <File className="h-4 w-4 text-gray-400" />
            )}
          </div>

          <span className="mr-2 text-sm text-gray-200">{node.name}</span>

          {/* Отображаем размер для файлов и папок */}
          {node.type === 'file' && node.size !== undefined && (
            <span className="text-xs text-gray-400 ml-auto">{formatFileSize(node.size)}</span>
          )}
          {node.type === 'directory' && directorySize !== undefined && directorySize > 0 && (
            <span className="text-xs text-gray-400 ml-auto">{formatFileSize(directorySize)}</span>
          )}
        </div>

        {node.type === 'directory' && isExpanded && node.children && node.children.length > 0 && (
          <div>
            {node.children.map((child, index) => {
              // Явное указание длины для TypeScript
              const childrenLength = node.children?.length || 0;
              return renderNode(
                child,
                depth + 1,
                index === childrenLength - 1, // является ли последним элементом
                [...parentIsLast, isLastChild], // накапливаем информацию о "последних" родителях
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Функция для обработки двойного клика на файле
  const handleDoubleClick = (node: FileNode) => {
    if (node.type === 'file') {
      setSelectedFile(node.path);
      setCodeViewerOpen(true);
    }
  };

  return (
    <div className="overflow-y-auto max-h-[calc(100vh-250px)] border border-gray-700 rounded-md p-3 bg-gray-800/90">
      {renderNode(data, 0, true, [])}

      {/* Модальное окно для просмотра кода */}
      <CodeViewer isOpen={codeViewerOpen} onClose={() => setCodeViewerOpen(false)} filePath={selectedFile} />
    </div>
  );
}
