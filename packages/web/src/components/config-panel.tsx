"use client"

import React, { useState } from 'react';
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { OpenFileButton } from "./open-file-button";
import { List, FileOutput } from "lucide-react";
import { ExportPathsDialog } from "./export-paths-dialog";
import { BulkSelectDialog } from "./bulk-select-dialog";

interface ConfigPanelProps {
  includeComments: boolean;
  onIncludeCommentsChange: (value: boolean) => void;
  newPageForEachFile: boolean;
  onNewPageForEachFileChange: (value: boolean) => void;
  useAbsolutePaths: boolean;
  onUseAbsolutePathsChange: (value: boolean) => void;
  outputFileName: string;
  onOutputFileNameChange: (value: string) => void;
  outputFormat: 'pdf' | 'markdown';
  onOutputFormatChange: (value: 'pdf' | 'markdown') => void;
  onGenerate: () => void;
  selectedFilesCount: number;
  lastGeneratedPdfPath?: string;
  onBulkSelectPaths?: (paths: string[]) => void;
  selectedFiles?: string[]; // Добавлено: массив выбранных файлов для экспорта
}

export function ConfigPanel({
  includeComments,
  onIncludeCommentsChange,
  newPageForEachFile,
  onNewPageForEachFileChange,
  useAbsolutePaths,
  onUseAbsolutePathsChange,
  outputFileName,
  onOutputFileNameChange,
  outputFormat,
  onOutputFormatChange,
  onGenerate,
  selectedFilesCount,
  lastGeneratedPdfPath,
  onBulkSelectPaths,
  selectedFiles = []
}: ConfigPanelProps) {
  // Состояние для отображения диалогов
  const [bulkSelectOpen, setBulkSelectOpen] = useState<boolean>(false);
  const [exportPathsOpen, setExportPathsOpen] = useState<boolean>(false);
  
  // Определяем путь для вывода файла (для использования в кнопке открытия)
  // Используем только существующий путь, если он есть
  const pdfPath = lastGeneratedPdfPath || '';
  
  // Обработчик для применения выбранных путей
  const handleApplyPaths = (paths: string[]) => {
    if (onBulkSelectPaths && paths.length > 0) {
      onBulkSelectPaths(paths);
    }
  };
  
  // Обработчик для изменения формата
  const handleFormatChange = (format: string) => {
    const newFormat = format as 'pdf' | 'markdown';
    onOutputFormatChange(newFormat);
    // Автоматически меняем расширение в имени файла
    const currentName = outputFileName.replace(/\.(pdf|md)$/i, '');
    const newExtension = newFormat === 'pdf' ? 'pdf' : 'md';
    onOutputFileNameChange(`${currentName}.${newExtension}`);
  };
  return (
    <div className="border border-gray-700 rounded-md p-4 space-y-4 bg-gray-800">
      <h2 className="text-lg font-semibold text-gray-100">Настройки генерации</h2>
      
      {/* Выбор формата вывода */}
      <div className="space-y-2">
        <Label className="text-gray-200">Формат вывода</Label>
        <Tabs value={outputFormat} onValueChange={handleFormatChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-700 text-gray-200">
            <TabsTrigger value="pdf" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">PDF</TabsTrigger>
            <TabsTrigger value="markdown" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">Markdown</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="include-comments" className="text-gray-200">Включить комментарии</Label>
          <Switch 
            id="include-comments" 
            checked={includeComments} 
            onCheckedChange={onIncludeCommentsChange}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="new-page" className="text-gray-200">Новая страница для каждого файла</Label>
          <Switch 
            id="new-page" 
            checked={newPageForEachFile} 
            onCheckedChange={onNewPageForEachFileChange}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="absolute-paths" className="text-gray-200">Использовать абсолютные пути в файле</Label>
          <Switch 
            id="absolute-paths" 
            checked={useAbsolutePaths} 
            onCheckedChange={onUseAbsolutePathsChange}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="output-file" className="text-gray-200">Имя выходного файла</Label>
          <Input 
            id="output-file" 
            value={outputFileName} 
            onChange={(e) => onOutputFileNameChange(e.target.value)} 
            placeholder={outputFormat === 'pdf' ? 'project_code.pdf' : 'project_code.md'}
            className="bg-gray-700 border-gray-600 text-gray-200 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      <div className="pt-2 space-y-2">
        {/* Кнопка для выбора файлов через текстовый список */}
        {onBulkSelectPaths && (
          <Button 
            variant="outline" 
            type="button"
            onClick={() => setBulkSelectOpen(true)}
            className="w-full bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-200"
          >
            <List className="w-4 h-4 mr-2" />
            Выбрать файлы из списка путей
          </Button>
        )}
        
        {/* Кнопка экспорта списка выбранных файлов */}
        {selectedFilesCount > 0 && (
          <Button 
            variant="outline" 
            type="button"
            onClick={() => setExportPathsOpen(true)}
            className="w-full bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-200"
          >
            <FileOutput className="w-4 h-4 mr-2" />
            Экспортировать пути выбранных файлов ({selectedFilesCount})
          </Button>
        )}
        
        <div className="flex gap-2">
          <Button 
            onClick={onGenerate}
            disabled={selectedFilesCount === 0}
            className={cn(
              "flex-1", 
              selectedFilesCount === 0 
                ? "bg-gray-600 cursor-not-allowed opacity-70" 
                : "bg-blue-600 hover:bg-blue-700 text-white"
            )}
          >
            Сгенерировать {outputFormat === 'pdf' ? 'PDF' : 'Markdown'}{selectedFilesCount > 0 ? ` (${selectedFilesCount} файлов)` : ''}
          </Button>
          
          {pdfPath && (
            <OpenFileButton 
              filePath={pdfPath}
              variant="outline"
              size="default"
              className="bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-200 px-3"
              tooltipText={`Открыть сгенерированный ${outputFormat === 'pdf' ? 'PDF' : 'Markdown файл'}`}
            />
          )}
        </div>
      </div>
      
      {/* Диалог для массового выбора файлов */}
      {onBulkSelectPaths && (
        <BulkSelectDialog
          isOpen={bulkSelectOpen}
          onClose={() => setBulkSelectOpen(false)}
          onApplyPaths={handleApplyPaths}
        />
      )}
      
      {/* Диалог для экспорта путей */}
      <ExportPathsDialog 
        isOpen={exportPathsOpen}
        onClose={() => setExportPathsOpen(false)}
        paths={selectedFiles}
      />
    </div>
  );
}