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

  const renderNode = (node: FileNode, depth = 0) => {
    const isExpanded = expanded[node.path];
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.path}>
        <div
          className={cn(
            'flex items-center py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-2',
            node.selected && 'bg-blue-50 dark:bg-blue-900/20',
          )}
          style={{ paddingLeft: `${depth * 16}px` }}
        >
          <Checkbox
            id={node.path}
            checked={node.selected}
            onCheckedChange={(checked: boolean | 'indeterminate') => handleSelectChange(node, checked === true)}
            className="mr-2"
          />

          {node.type === 'directory' && (
            <button type="button" onClick={() => toggleExpand(node.path)} className="mr-2 focus:outline-none">
              {hasChildren &&
                (isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                ))}
              {!hasChildren && <div className="w-4" />}
            </button>
          )}

          {node.type === 'directory' ? (
            <Folder className="h-4 w-4 mr-2 text-blue-500" />
          ) : (
            <File className="h-4 w-4 mr-2 text-gray-500" />
          )}

          <span className="mr-2 text-sm">{node.name}</span>

          {node.type === 'file' && node.size !== undefined && (
            <span className="text-xs text-gray-500 ml-auto">{formatFileSize(node.size)}</span>
          )}
        </div>

        {node.type === 'directory' && isExpanded && node.children && (
          <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return <div className="overflow-y-auto max-h-[calc(100vh-250px)] border rounded-md p-2">{renderNode(data)}</div>;
}
