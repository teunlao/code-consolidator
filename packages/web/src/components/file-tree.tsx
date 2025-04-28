'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { formatFileSize } from '@/lib/format-utils';
import type { FileNode } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, File, Folder } from 'lucide-react';
import React, { useState } from 'react';

interface FileTreeProps {
  data: FileNode;
  onSelect: (path: string, selected: boolean) => void;
}

export function FileTree({ data, onSelect }: FileTreeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (path: string) => {
    setExpanded((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const handleSelectChange = (node: FileNode, checked: boolean) => {
    onSelect(node.path, checked);
  };
  
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
          {parentIsLast.map((isLast, index) => 
            !isLast && index > 0 && (
              <div 
                key={index} 
                className="absolute border-l border-gray-700" 
                style={{ 
                  left: `${(index) * 12 + 6}px`,
                  top: 0,
                  bottom: 0,
                }}
              />
            )
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
            // Предотвращаем всплытие события, если клик был на чекбоксе
            if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[role="checkbox"]')) {
              return;
            }

            // Если клик на папке - разворачиваем/сворачиваем
            if (node.type === 'directory') {
              toggleExpand(node.path);
            }
            // Если клик на файле - меняем состояние чекбокса
            else if (node.type === 'file') {
              handleSelectChange(node, !node.selected);
            }
          }}
        >
          <Checkbox
            id={node.path}
            checked={node.selected}
            onCheckedChange={(checked: boolean | 'indeterminate') => handleSelectChange(node, checked === true)}
            className="mr-2 border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            // Останавливаем всплытие события при клике на чекбокс
            onClick={(e) => e.stopPropagation()}
          />

          {/* Фиксированная область для стрелок, всегда одинаковой ширины */}
          <div className="w-4 h-4 mr-2 flex items-center justify-center flex-shrink-0">
            {node.type === 'directory' && hasChildren && (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )
            )}
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
          {(node.type === 'file' && node.size !== undefined) && (
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
                [...parentIsLast, isLastChild] // накапливаем информацию о "последних" родителях
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="overflow-y-auto max-h-[calc(100vh-250px)] border border-gray-700 rounded-md p-3 bg-gray-800/90">
      {renderNode(data, 0, true, [])}
    </div>
  );
}
