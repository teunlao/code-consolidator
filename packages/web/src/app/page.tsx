'use client';

import { ConfigPanel } from '@/components/config-panel';
import { FileTree } from '@/components/file-tree';
import { FilterSettingsButton } from '@/components/filter-settings';
import { OpenFileButton } from '@/components/open-file-button';
import { ProjectInfo } from '@/components/project-info';
import { ProjectSelector } from '@/components/project-manager';
import { SearchFilter } from '@/components/search-filter';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { findNodeByPath, selectNodeAndChildren } from '@/lib/path-finder';
import { DEFAULT_PROJECT_SETTINGS, useProjectsStore } from '@/lib/stores/projects-store';
import { countSelectedFiles, getSelectedFilePaths, updateNodeSelection } from '@/lib/tree-utils';
import type { FileNode, FilterSettings } from '@/lib/types';
import { Check, FolderOpen, Loader2, RotateCcw } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export default function Home() {
  const [fileTree, setFileTree] = useState<FileNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedPdfPath, setGeneratedPdfPath] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [selectedFilesCount, setSelectedFilesCount] = useState(0);

  // Используем Zustand-хранилище для проектов и профилей
  const { getActiveSettings, updateActiveSettings, applySelectedFilesToTree } = useProjectsStore();

  const activeSettings = getActiveSettings();

  // Храним информацию о том, была ли первая загрузка
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Получаем идентификаторы активных проекта и профиля для отслеживания изменений
  const { activeProjectId, activeProfileId } = useProjectsStore();

  // Загрузка дерева файлов при инициализации, изменении настроек фильтрации
  // или при переключении между профилями
  useEffect(() => {
    const isFirstLoad = !initialLoadDone;
    fetchFileTree(activeSettings.filterSettings, isFirstLoad);

    if (!initialLoadDone) {
      setInitialLoadDone(true);
    }
  }, [
    activeSettings.filterSettings,
    initialLoadDone,
    // Теперь эффект будет срабатывать при смене профиля или проекта
    activeProjectId,
    activeProfileId,
  ]);

  // Функция для загрузки дерева файлов
  async function fetchFileTree(filterSettings: FilterSettings, isInitialLoad = false) {
    try {
      // Устанавливаем лоадер только при первой загрузке, но не при смене профиля/проекта
      if (isInitialLoad) {
        setLoading(true);
      }

      // Сначала очищаем текущее дерево при смене профиля
      // Это необходимо, чтобы гарантировать, что старые выбранные файлы не сохранятся
      if (!isInitialLoad) {
        setFileTree(null);
      }

      const response = await fetch('/api/file-tree', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filterSettings,
        }),
      });

      const data = await response.json();

      if (data.fileTree) {
        // Явно получаем самые актуальные настройки для текущего профиля
        // Это особенно важно при переключении между профилями
        const currentSettings = getActiveSettings();

        // Применяем сохраненные выбранные файлы к полученному дереву
        const treeWithSelection =
          currentSettings.selectedFiles.length > 0
            ? applySelectedFilesToTree(data.fileTree, currentSettings.selectedFiles)
            : data.fileTree;

        setFileTree(treeWithSelection);

        // Обновляем счетчик выбранных файлов
        setSelectedFilesCount(countSelectedFiles(treeWithSelection));
      }
    } catch (error) {
      console.error('Error fetching file tree:', error);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }

  // Функция для сброса всех настроек до дефолтных значений
  const resetAllSettings = () => {
    const defaultFilterSettings: FilterSettings = {
      ignoredDirectories: [],
      ignoredFiles: [],
      ignoredExtensions: [],
      allowedExtensions: [],
      useDefaultIgnores: true,
    };

    updateActiveSettings({
      includeComments: true,
      newPageForEachFile: true,
      outputFileName: 'project_code.md',
      outputFormat: 'markdown',
      filterSettings: defaultFilterSettings,
      selectedFiles: [],
    });

    // Перезагружаем дерево файлов с новыми настройками
    fetchFileTree(defaultFilterSettings);
  };

  // Функция для обновления выбранных файлов в дереве
  const handleSelectNode = (path: string, selected: boolean) => {
    if (!fileTree) return;

    const updatedTree = updateNodeSelection(fileTree, path, selected);
    setFileTree(updatedTree);

    const selectedFiles = getSelectedFilePaths(updatedTree);

    // Сбрасываем имя файла и обновляем список выбранных файлов одним вызовом
    updateActiveSettings({
      selectedFiles,
      outputFileName: '', // Сброс имени файла
    });

    // Обновляем счетчик выбранных файлов
    setSelectedFilesCount(countSelectedFiles(updatedTree));
  };

  // Функция для генерации PDF
  const handleGeneratePdf = async () => {
    if (!fileTree) return;

    setGenerating(true);

    const selectedFiles = getSelectedFilePaths(fileTree);

    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: selectedFiles,
          outputFile: activeSettings.outputFileName,
          includeComments: activeSettings.includeComments,
          newPageForEachFile: activeSettings.newPageForEachFile,
          useAbsolutePaths: activeSettings.useAbsolutePaths,
          outputFormat: activeSettings.outputFormat,
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

  // Функция для массового выбора файлов из списка путей
  const handleBulkSelectPaths = async (paths: string[]) => {
    console.log('Получили пути для обработки:', paths);

    if (!fileTree || paths.length === 0) {
      console.warn('Дерево файлов не загружено или список путей пуст');
      return;
    }

    // Создаем копию текущего дерева файлов
    let updatedTree = structuredClone(fileTree) as FileNode;
    let successfullyMatched = 0;
    const notFoundPaths: string[] = [];

    // Перебираем все пути и находим соответствующие узлы
    for (const path of paths) {
      const normalizedPath = path.trim();
      if (!normalizedPath) continue;

      // Ищем узел, соответствующий этому пути
      const foundNode = findNodeByPath(updatedTree, normalizedPath);

      if (foundNode) {
        // Если узел найден, выбираем его и все его дочерние элементы
        updatedTree = selectNodeAndChildren(updatedTree, foundNode, true);
        successfullyMatched++;
      } else {
        notFoundPaths.push(normalizedPath);
      }
    }

    console.log(`Успешно найдено и выбрано ${successfullyMatched} из ${paths.length} путей`);

    if (notFoundPaths.length > 0) {
      console.warn('Не удалось найти следующие пути:', notFoundPaths);
    }

    // Обновляем дерево файлов - использовать правильное глубокое копирование
    // чтобы React точно увидел изменение
    setFileTree(null); // Сначала "обнуляем" дерево
    setTimeout(() => {
      // Затем устанавливаем обновленное значение
      setFileTree(updatedTree);

      // Получаем обновленный список выбранных файлов
      const selectedFiles = getSelectedFilePaths(updatedTree);
      updateActiveSettings({
        selectedFiles,
      });

      // Обновляем счетчик выбранных файлов
      setSelectedFilesCount(countSelectedFiles(updatedTree));
    }, 10); // Небольшая задержка для гарантии обновления UI

    // Добавляем только запись в консоль для отладки
    console.log(`Выбрано ${successfullyMatched} из ${paths.length} указанных путей.`);
  };

  // Функция для поиска в дереве файлов
  const handleSearch = (query: string) => {
    setSearchQuery(query.toLowerCase());

    // Поисковый запрос будет передан в FileTree компонент
    // и папки будут автоматически раскрыты, если результатов немного
  };

  // Фильтрация дерева файлов по поисковому запросу
  const filterTree = (node: FileNode): FileNode | null => {
    if (!searchQuery) return node;

    if (node.name.toLowerCase().includes(searchQuery)) {
      return node;
    }

    if (node.children && node.children.length > 0) {
      const filteredChildren = node.children.map((child) => filterTree(child)).filter(Boolean) as FileNode[];

      if (filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }
    }

    return null;
  };

  // Функция для установки имени файла из названия папки
  const handleSetOutputNameFromFolder = (folderName: string) => {
    const extension =
      activeSettings.outputFormat === 'pdf' ? '.pdf' : activeSettings.outputFormat === 'markdown' ? '.md' : '.zip';
    const sanitizedName = folderName.replace(/[^a-zA-Z0-9_-]/g, '_'); // Очистка имени
    updateActiveSettings({ outputFileName: `${sanitizedName}${extension}` });
  };

  const filteredTree = fileTree && searchQuery ? filterTree(fileTree) : fileTree;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        <span className="ml-2 text-lg text-gray-200">Загрузка структуры проекта...</span>
      </div>
    );
  }

  return (
    <main className="container mx-auto py-8 px-4 bg-gray-900">
      <h1 className="text-2xl font-bold mb-6 text-gray-100">Code Consolidator</h1>

      {/* Селектор проектов и профилей */}
      <ProjectSelector />

      {/* Информация о текущем проекте/профиле */}
      <ProjectInfo />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <SearchFilter onSearch={handleSearch} filterSettings={activeSettings.filterSettings} />

          {filteredTree ? (
            <FileTree
              data={filteredTree}
              onSelect={handleSelectNode}
              searchQuery={searchQuery}
              onSetOutputNameFromFolder={handleSetOutputNameFromFolder}
            />
          ) : (
            <div className="border border-gray-700 rounded-md p-8 text-center bg-gray-800">
              <p className="text-gray-400">Файлы не найдены</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Блок с настройками фильтрации и кнопкой сброса */}
          <div className="border border-gray-700 rounded-md p-4 space-y-3 bg-gray-800">
            {/* Кнопка сброса над кнопкой фильтрации */}
            <div className="w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={resetAllSettings}
                title="Сбросить все настройки"
                className="w-full bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200"
              >
                <RotateCcw className="h-4 w-4 mr-1" /> Сбросить
              </Button>
            </div>

            {/* Кнопка настройки фильтрации */}
            <div className="w-full">
              <FilterSettingsButton
                settings={activeSettings.filterSettings}
                onSettingsChange={(newFilterSettings) => updateActiveSettings({ filterSettings: newFilterSettings })}
              />
            </div>
          </div>

          <ConfigPanel
            includeComments={activeSettings.includeComments}
            onIncludeCommentsChange={(value) => updateActiveSettings({ includeComments: value })}
            newPageForEachFile={activeSettings.newPageForEachFile}
            onNewPageForEachFileChange={(value) => updateActiveSettings({ newPageForEachFile: value })}
            useAbsolutePaths={activeSettings.useAbsolutePaths}
            onUseAbsolutePathsChange={(value) => updateActiveSettings({ useAbsolutePaths: value })}
            outputFileName={activeSettings.outputFileName}
            onOutputFileNameChange={(value) => updateActiveSettings({ outputFileName: value })}
            outputFormat={activeSettings.outputFormat}
            onOutputFormatChange={(value) => updateActiveSettings({ outputFormat: value })}
            onGenerate={handleGeneratePdf}
            selectedFilesCount={selectedFilesCount}
            lastGeneratedPdfPath={generatedPdfPath}
            onBulkSelectPaths={handleBulkSelectPaths}
            selectedFiles={fileTree ? getSelectedFilePaths(fileTree) : []}
          />
        </div>
      </div>

      {/* Диалог успешной генерации */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 text-gray-100">
          <DialogHeader>
            <DialogTitle className="flex items-center text-gray-100">
              <Check className="h-6 w-6 text-green-400 mr-2" />
              Файл успешно сгенерирован
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="mb-4 text-gray-300">Файл сохранен по пути:</p>
            <div className="relative bg-gray-900 p-2 rounded border border-gray-700">
              <code className="block w-full text-gray-300 overflow-x-auto pr-10">{generatedPdfPath}</code>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <OpenFileButton
                  filePath={generatedPdfPath}
                  variant="ghost"
                  className="flex-shrink-0 text-gray-400 hover:text-gray-200 hover:bg-transparent rounded-full"
                  tooltipText="Открыть местоположение файла"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => setShowSuccessDialog(false)}
              className="mr-2 bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600"
              variant="outline"
            >
              Закрыть
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Индикатор генерации */}
      {generating && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl flex items-center border border-gray-700">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400 mr-3" />
            <span className="text-gray-200">Генерация файла...</span>
          </div>
        </div>
      )}
    </main>
  );
}
