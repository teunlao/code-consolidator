"use client"

import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EditableList } from '@/components/editable-list';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Settings } from 'lucide-react';

interface FilterSettings {
  ignoredDirectories: string[];
  ignoredFiles: string[];
  ignoredExtensions: string[];
  allowedExtensions: string[];
  useDefaultIgnores: boolean;
}

interface FilterSettingsProps {
  settings: FilterSettings;
  onSettingsChange: (settings: FilterSettings) => void;
}

const DEFAULT_IGNORED_DIRECTORIES = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'tmp',
  'coverage',
  '.next',
  '.nuxt',
];

const DEFAULT_IGNORED_FILES = [
  '.DS_Store',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
];

const DEFAULT_IGNORED_EXTENSIONS = [
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.bmp',
  '.ico',
  '.webp',
  '.pdf',
  '.exe',
  '.dll',
  '.so',
  '.zip',
];

export function FilterSettingsButton({ settings, onSettingsChange }: FilterSettingsProps) {
  const [open, setOpen] = useState(false);
  // Создаем локальную копию настроек, которая будет обновляться внутри диалога
  const [localSettings, setLocalSettings] = useState<FilterSettings>({ ...settings });
  
  // Сбрасываем локальные настройки при открытии диалога
  React.useEffect(() => {
    if (open) {
      setLocalSettings({ ...settings });
    }
  }, [open, settings]);
  
  // Функция для сохранения настроек
  const handleSave = () => {
    onSettingsChange(localSettings);
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200"
      >
        <Settings className="h-4 w-4 mr-2" />
        <span>Настройки фильтрации</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gray-800 border-gray-700 text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-gray-100">Настройки фильтрации</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-gray-400 mb-4">
              Настройте правила фильтрации файлов и директорий проекта.
            </p>
            
            <Tabs defaultValue="directories">
              <TabsList className="w-full bg-gray-700">
                <TabsTrigger value="directories" className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white">Директории</TabsTrigger>
                <TabsTrigger value="files" className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white">Файлы</TabsTrigger>
                <TabsTrigger value="extensions" className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white">Расширения</TabsTrigger>
              </TabsList>

              <TabsContent value="directories" className="mt-4 space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="use-default-ignores" className="text-gray-200">Использовать стандартные игнорируемые директории</Label>
                  <Switch
                    id="use-default-ignores"
                    checked={localSettings.useDefaultIgnores}
                    onCheckedChange={(checked) => {
                      setLocalSettings({
                        ...localSettings,
                        useDefaultIgnores: checked,
                      });
                    }}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>

                {localSettings.useDefaultIgnores && (
                  <div className="mb-4">
                    <Label className="text-sm text-gray-400">Стандартные игнорируемые директории:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {DEFAULT_IGNORED_DIRECTORIES.map((dir) => (
                        <div key={dir} className="bg-gray-700 text-gray-300 text-xs rounded px-2 py-1">
                          {dir}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-gray-200">Дополнительные игнорируемые директории:</Label>
                  <EditableList
                    items={localSettings.ignoredDirectories}
                    onItemsChange={(items) => setLocalSettings({ ...localSettings, ignoredDirectories: items })}
                    placeholder="Введите имя директории..."
                    badgeVariant="secondary"
                  />
                </div>
              </TabsContent>

              <TabsContent value="files" className="mt-4 space-y-4">
                <Label className="text-gray-200">Игнорируемые файлы (можно использовать * как шаблон):</Label>
                <EditableList
                  items={localSettings.ignoredFiles}
                  onItemsChange={(items) => setLocalSettings({ ...localSettings, ignoredFiles: items })}
                  placeholder="Введите имя файла или шаблон..."
                  badgeVariant="destructive"
                />
              </TabsContent>

              <TabsContent value="extensions" className="mt-4 space-y-4">
                <div>
                  <Label className="text-gray-200">Игнорируемые расширения файлов:</Label>
                  <EditableList
                    items={localSettings.ignoredExtensions}
                    onItemsChange={(items) => setLocalSettings({ ...localSettings, ignoredExtensions: items })}
                    placeholder="Введите расширение (с точкой, например .js)..."
                    validateItem={(item) => item.startsWith('.')}
                    errorMessage="Расширение должно начинаться с точки (например .js)"
                    badgeVariant="destructive"
                  />
                </div>

                <div className="mt-6">
                  <Label className="text-gray-200">Разрешенные расширения файлов:</Label>
                  <p className="text-sm text-gray-400 mb-2">
                    Если указано хотя бы одно расширение, будут включены только файлы с этими расширениями
                  </p>
                  <EditableList
                    items={localSettings.allowedExtensions}
                    onItemsChange={(items) => setLocalSettings({ ...localSettings, allowedExtensions: items })}
                    placeholder="Введите расширение (с точкой, например .js)..."
                    validateItem={(item) => item.startsWith('.')}
                    errorMessage="Расширение должно начинаться с точки (например .js)"
                    badgeVariant="default"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button onClick={handleSave} className="bg-blue-600 text-white hover:bg-blue-700">
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
