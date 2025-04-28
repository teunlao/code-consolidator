"use client"

import React, { useEffect, useState } from 'react';
import { FileTree } from '@/components/file-tree';
import { ConfigPanel } from '@/components/config-panel';
import { SearchFilter } from '@/components/search-filter';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, Loader2, RotateCcw } from 'lucide-react';
import { FileNode } from '@/lib/types';
import { FilterSettingsButton } from '@/components/filter-settings';

// Ключи для localStorage
const STORAGE_KEYS = {
  INCLUDE_COMMENTS: 'code-consolidator-include-comments',
  NEW_PAGE_FOR_EACH_FILE: 'code-consolidator-new-page-for-each-file',
  OUTPUT_FILE_NAME: 'code-consolidator-output-file-name',
  FILTER_SETTINGS: 'code-consolidator-filter-settings',
};

// Интерфейс для настроек фильтрации
interface FilterSettings {
  ignoredDirectories: string[];
  ignoredFiles: string[];
  ignoredExtensions: string[];
  allowedExtensions: string[];
  useDefaultIgnores: boolean;
}

// Дефолтные настройки фильтрации
const DEFAULT_FILTER_SETTINGS: FilterSettings = {
  ignoredDirectories: [],
  ignoredFiles: [],
  ignoredExtensions: [],
  allowedExtensions: [],
  useDefaultIgnores: true,
};

export default function Home() {
  const [fileTree, setFileTree] = useState<FileNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [includeComments, setIncludeComments] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.INCLUDE_COMMENTS);
      return saved ? JSON.parse(saved) : true;
    }
    return true;
  });
  const [newPageForEachFile, setNewPageForEachFile] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.NEW_PAGE_FOR_EACH_FILE);
      return saved ? JSON.parse(saved) : true;
    }
    return true;
  });
  const [outputFileName, setOutputFileName] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.OUTPUT_FILE_NAME);
      return saved || 'project_code.pdf';
    }
    return 'project_code.pdf';
  });
  const [generating, setGenerating] = useState(false);
  const [generatedPdfPath, setGeneratedPdfPath] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [selectedFilesCount, setSelectedFilesCount] = useState(0);
  
  // Состояние для настроек фильтрации
  const [filterSettings, setFilterSettings] = useState<FilterSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.FILTER_SETTINGS);
      return saved ? JSON.parse(saved) : DEFAULT_FILTER_SETTINGS;
    }
    return DEFAULT_FILTER_SETTINGS;
  });
  
  // Загрузка дерева файлов
  useEffect(() => {
    fetchFileTree();
  }, []);
  
  // Повторная загрузка дерева файлов при изменении настроек фильтрации
  useEffect(() => {
    fetchFileTree(filterSettings);
  }, [filterSettings]);
  
  // Функция для загрузки дерева файлов
  async function fetchFileTree(settings?: FilterSettings) {
    try {
      setLoading(true);
      
      let response;
      if (settings) {
        // Если есть настройки, отправляем их через POST
        response = await fetch('/api/file-tree', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filterSettings: settings
          }),
        });
      } else {
        // Иначе используем GET без параметров
        response = await fetch('/api/file-tree');
      }
      
      const data = await response.json();
      
      if (data.fileTree) {
        setFileTree(data.fileTree);
      }
    } catch (error) {
      console.error('Error fetching file tree:', error);
    } finally {
      setLoading(false);
    }
  }
  
  // Сохраняем настройки в localStorage при их изменении
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.INCLUDE_COMMENTS, JSON.stringify(includeComments));
    }
  }, [includeComments]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.NEW_PAGE_FOR_EACH_FILE, JSON.stringify(newPageForEachFile));
    }
  }, [newPageForEachFile]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.OUTPUT_FILE_NAME, outputFileName);
    }
  }, [outputFileName]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.FILTER_SETTINGS, JSON.stringify(filterSettings));
    }
  }, [filterSettings]);

  // Функция для обновления настроек фильтрации
  const handleFilterSettingsChange = (newSettings: FilterSettings) => {
    setFilterSettings(newSettings);
  };
  
  // Функция для сброса всех настроек до дефолтных значений
  const resetAllSettings = () => {
    setIncludeComments(true);
    setNewPageForEachFile(true);
    setOutputFileName('project_code.pdf');
    setFilterSettings(DEFAULT_FILTER_SETTINGS);
  };
  
  // Функция для обновления выбранных файлов в дереве
  const handleSelectNode = (path: string, selected: boolean) => {
    if (!fileTree) return;
    
    const updateNodeSelection = (node: FileNode): FileNode => {
      if (node.path === path) {
        // Если это директория, обновляем все дочерние элементы
        if (node.type === 'directory' && node.children) {
          return {
            ...node,
            selected,
            children: node.children.map(child => ({
              ...child,
              selected,
              children: child.children 
                ? child.children.map(grandchild => updateNodeSelection({ 
                    ...grandchild, 
                    selected 
                  }))
                : undefined
            }))
          };
        }
        
        // Если это файл, просто обновляем его статус
        return { ...node, selected };
      }
      
      // Если это не искомый узел, но у него есть дети
      if (node.children) {
        return {
          ...node,
          children: node.children.map(child => updateNodeSelection(child))
        };
      }
      
      return node;
    };
    
    const updatedTree = updateNodeSelection(fileTree);
    setFileTree(updatedTree);
    
    // Обновляем счетчик выбранных файлов
    const countSelectedFiles = (node: FileNode): number => {
      let count = node.type === 'file' && node.selected ? 1 : 0;
      
      if (node.children) {
        count += node.children.reduce((acc, child) => acc + countSelectedFiles(child), 0);
      }
      
      return count;
    };
    
    setSelectedFilesCount(countSelectedFiles(updatedTree));
  };
  
  // Функция для генерации PDF
  const handleGeneratePdf = async () => {
    if (!fileTree) return;
    
    setGenerating(true);
    
    // Получаем список всех выбранных файлов
    const getSelectedFilePaths = (node: FileNode): string[] => {
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
    };
    
    const selectedFiles = getSelectedFilePaths(fileTree);
    
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: selectedFiles,
          outputFile: outputFileName,
          includeComments,
          newPageForEachFile,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setGeneratedPdfPath(data.pdfPath);
        setShowSuccessDialog(true);
      } else {
        console.error('Error generating PDF:', data.error);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setGenerating(false);
    }
  };
  
  // Функция для поиска в дереве файлов
  const handleSearch = (query: string) => {
    setSearchQuery(query.toLowerCase());
  };
  
  // Фильтрация дерева файлов по поисковому запросу
  const filterTree = (node: FileNode): FileNode | null => {
    if (!searchQuery) return node;
    
    if (node.name.toLowerCase().includes(searchQuery)) {
      return node;
    }
    
    if (node.children) {
      const filteredChildren = node.children
        .map(child => filterTree(child))
        .filter(Boolean) as FileNode[];
      
      if (filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }
    }
    
    return null;
  };
  
  const filteredTree = fileTree && searchQuery 
    ? filterTree(fileTree) 
    : fileTree;
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-lg">Загрузка структуры проекта...</span>
      </div>
    );
  }
  
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Code Consolidator</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <SearchFilter onSearch={handleSearch} />
          
          {filteredTree ? (
            <FileTree 
              data={filteredTree} 
              onSelect={handleSelectNode} 
            />
          ) : (
            <div className="border rounded-md p-8 text-center">
              <p className="text-gray-500">Файлы не найдены</p>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          {/* Блок с настройками фильтрации и кнопкой сброса */}
          <div className="border rounded-md p-4 space-y-3">
            {/* Кнопка сброса над кнопкой фильтрации */}
            <div className="w-full">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetAllSettings}
                title="Сбросить все настройки"
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-1" /> Сбросить
              </Button>
            </div>
            
            {/* Кнопка настройки фильтрации */}
            <div className="w-full">
              <FilterSettingsButton 
                settings={filterSettings}
                onSettingsChange={handleFilterSettingsChange}
              />
            </div>
          </div>
          
          <ConfigPanel 
            includeComments={includeComments}
            onIncludeCommentsChange={setIncludeComments}
            newPageForEachFile={newPageForEachFile}
            onNewPageForEachFileChange={setNewPageForEachFile}
            outputFileName={outputFileName}
            onOutputFileNameChange={setOutputFileName}
            onGenerate={handleGeneratePdf}
            selectedFilesCount={selectedFilesCount}
          />
        </div>
      </div>
      
      {/* Диалог успешной генерации */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Check className="h-6 w-6 text-green-500 mr-2" />
              PDF успешно сгенерирован
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="mb-4">Файл сохранен по пути:</p>
            <code className="bg-gray-100 p-2 rounded block overflow-x-auto">
              {generatedPdfPath}
            </code>
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={() => setShowSuccessDialog(false)}
              className="mr-2"
              variant="outline"
            >
              Закрыть
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Индикатор генерации */}
      {generating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl flex items-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-3" />
            <span>Генерация PDF...</span>
          </div>
        </div>
      )}
    </main>
  );
}