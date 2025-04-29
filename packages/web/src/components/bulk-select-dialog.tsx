'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileCheck, Info } from 'lucide-react';

interface BulkSelectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPaths: (paths: string[]) => void;
}

export function BulkSelectDialog({
  isOpen,
  onClose,
  onApplyPaths,
}: BulkSelectDialogProps) {
  const [pathsText, setPathsText] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);

  // Функция для обработки вставленных путей
  const handleApply = () => {
    setProcessing(true);
    
    try {
      // Разбиваем текст на строки и удаляем пустые строки
      const paths = pathsText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      console.log('Передаем пути для обработки:', paths);
      
      // Проверяем, есть ли пути для обработки
      if (paths.length === 0) {
        console.warn('Список путей пуст');
        return;
      }
      
      // Передаем пути для обработки
      onApplyPaths(paths);
      
      // Закрываем диалог
      handleClose();
    } catch (error) {
      console.error('Error processing paths:', error);
    } finally {
      setProcessing(false);
    }
  };

  // Функция для закрытия диалога и сброса состояния
  const handleClose = () => {
    setPathsText('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-gray-100 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-gray-100 flex items-center">
            <FileCheck className="h-5 w-5 mr-2 text-blue-400" />
            Выбор файлов по списку путей
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="flex items-start bg-gray-700/50 p-3 rounded-md text-sm">
            <Info className="h-5 w-5 mr-2 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-gray-300">
              Вставьте список абсолютных путей к файлам или папкам, которые вы хотите выбрать. 
              Каждый путь должен быть на отдельной строке. Папки будут выбраны вместе со всем содержимым.
              <br /><br />
              <strong>Важно:</strong> Пути должны соответствовать реальным путям в вашем проекте и быть видны в текущем дереве файлов.
            </p>
          </div>
          
          <Textarea
            value={pathsText}
            onChange={(e) => setPathsText(e.target.value)}
            placeholder="Например:
/Users/username/project/src/components/button.tsx
/Users/username/project/src/utils
/Users/username/project/package.json"
            className="h-60 bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500"
          />
        </div>
        
        <DialogFooter className="pt-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600"
          >
            Отмена
          </Button>
          <Button
            onClick={handleApply}
            disabled={!pathsText.trim() || processing}
            className="bg-blue-600 hover:bg-blue-500 text-white"
          >
            Применить выбор
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
