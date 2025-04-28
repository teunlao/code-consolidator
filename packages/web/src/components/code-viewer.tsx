'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Loader2, X } from 'lucide-react';
import { Button } from './ui/button';

interface CodeViewerProps {
  isOpen: boolean;
  onClose: () => void;
  filePath: string | null;
}

export function CodeViewer({ isOpen, onClose, filePath }: CodeViewerProps) {
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>('text');

  // Клиентская версия функций path.extname и path.basename
  const getExtension = (filePath: string): string => {
    const parts = filePath.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  };
  
  const getBasename = (filePath: string): string => {
    const parts = filePath.split('/');
    return parts[parts.length - 1];
  };

  // Функция для определения языка программирования на основе расширения файла
  const determineLanguage = (filePath: string): string => {
    const extension = getExtension(filePath);
    
    // Карта соответствия расширений языкам для подсветки синтаксиса
    const extensionMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'tsx',
      'py': 'python',
      'rb': 'ruby',
      'java': 'java',
      'php': 'php',
      'go': 'go',
      'rs': 'rust',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
      'swift': 'swift',
      'kt': 'kotlin',
      'dart': 'dart',
      'sh': 'bash',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sql': 'sql',
      'graphql': 'graphql',
      'xml': 'xml',
    };
    
    return extensionMap[extension] || 'text';
  };

  // Загрузка содержимого файла
  useEffect(() => {
    if (isOpen && filePath) {
      setLoading(true);
      setError(null);
      
      // Определяем язык по расширению файла
      setLanguage(determineLanguage(filePath));
      
      fetch('/api/file-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath }),
      })
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            setError(data.error);
          } else {
            setCode(data.content);
          }
        })
        .catch(err => {
          setError(`Ошибка загрузки файла: ${err.message}`);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, filePath]);

  // Функция для закрытия модального окна
  const handleClose = () => {
    setCode('');
    setError(null);
    onClose();
  };

  const fileName = filePath ? getBasename(filePath) : '';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-gray-100 max-w-5xl h-[80vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center border-b border-gray-700 pb-2">
          <DialogTitle className="text-gray-100">
            {fileName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-auto flex-grow mt-2">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-blue-400 mr-2" />
              <span>Загрузка файла...</span>
            </div>
          ) : error ? (
            <div className="text-red-400 p-4">
              {error}
            </div>
          ) : (
            <SyntaxHighlighter
              language={language}
              style={oneDark}
              showLineNumbers
              wrapLines
              customStyle={{
                backgroundColor: 'transparent',
                margin: 0,
                padding: '1rem',
                borderRadius: '0.375rem',
                fontSize: '14px',
              }}
            >
              {code}
            </SyntaxHighlighter>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
