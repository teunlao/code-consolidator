'use client';

import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Copy, Download, File } from 'lucide-react';

interface ExportPathsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  paths: string[];
}

export function ExportPathsDialog({ isOpen, onClose, paths }: ExportPathsDialogProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('list');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Преобразуем пути в различные форматы
  const plainPaths = paths.join('\n');
  const jsonPaths = JSON.stringify(paths, null, 2);
  
  // Подготовка данных для экспорта в CSV/TSV
  const csvPaths = paths.map(path => `"${path.replace(/"/g, '""')}"`).join('\n');

  // Обработчик для копирования текста
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Обработчик для скачивания файла
  const handleDownload = (content: string, fileType: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Имя файла в зависимости от типа
    let fileName = 'selected_paths';
    if (fileType === 'json') fileName += '.json';
    else if (fileType === 'csv') fileName += '.csv';
    else fileName += '.txt';
    
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Получение активного содержимого в зависимости от выбранной вкладки
  const getActiveContent = () => {
    switch (activeTab) {
      case 'json': return jsonPaths;
      case 'csv': return csvPaths;
      default: return plainPaths;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-gray-800 border-gray-700 text-gray-100 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-gray-100">
            <File className="h-5 w-5 mr-2" />
            Экспорт путей выбранных файлов ({paths.length})
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="list" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-700 border-gray-600">
            <TabsTrigger value="list" className="data-[state=active]:bg-gray-600">Список</TabsTrigger>
            <TabsTrigger value="json" className="data-[state=active]:bg-gray-600">JSON</TabsTrigger>
            <TabsTrigger value="csv" className="data-[state=active]:bg-gray-600">CSV</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="p-0 mt-2">
            <div className="border border-gray-700 rounded-md overflow-hidden">
              <Textarea
                ref={textAreaRef}
                readOnly
                value={plainPaths}
                className="bg-gray-900 border-0 text-gray-300 font-mono text-sm p-3 h-60 resize-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="json" className="p-0 mt-2">
            <div className="border border-gray-700 rounded-md overflow-hidden">
              <Textarea
                readOnly
                value={jsonPaths}
                className="bg-gray-900 border-0 text-gray-300 font-mono text-sm p-3 h-60 resize-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="csv" className="p-0 mt-2">
            <div className="border border-gray-700 rounded-md overflow-hidden">
              <Textarea
                readOnly
                value={csvPaths}
                className="bg-gray-900 border-0 text-gray-300 font-mono text-sm p-3 h-60 resize-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col sm:flex-row sm:space-x-2 gap-2">
          <Button
            variant="outline"
            className="bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200"
            onClick={() => handleCopy(getActiveContent())}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Скопировано
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Копировать
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            className="bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200"
            onClick={() => handleDownload(getActiveContent(), activeTab)}
          >
            <Download className="h-4 w-4 mr-2" />
            Скачать {activeTab === 'json' ? '.json' : activeTab === 'csv' ? '.csv' : '.txt'}
          </Button>
          
          <Button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
