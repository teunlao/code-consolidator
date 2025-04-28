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

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center"
      >
        <Settings className="h-4 w-4 mr-2" />
        <span>Настройки фильтрации</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Настройки фильтрации</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Настройте правила фильтрации файлов и директорий проекта.
            </p>
            
            <Tabs defaultValue="directories">
              <TabsList className="w-full">
                <TabsTrigger value="directories" className="flex-1">Директории</TabsTrigger>
                <TabsTrigger value="files" className="flex-1">Файлы</TabsTrigger>
                <TabsTrigger value="extensions" className="flex-1">Расширения</TabsTrigger>
              </TabsList>

              <TabsContent value="directories" className="mt-4 space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="use-default-ignores">Использовать стандартные игнорируемые директории</Label>
                  <Switch
                    id="use-default-ignores"
                    checked={settings.useDefaultIgnores}
                    onCheckedChange={(checked) => {
                      onSettingsChange({
                        ...settings,
                        useDefaultIgnores: checked,
                      });
                    }}
                  />
                </div>

                {settings.useDefaultIgnores && (
                  <div className="mb-4">
                    <Label className="text-sm text-muted-foreground">Стандартные игнорируемые директории:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {DEFAULT_IGNORED_DIRECTORIES.map((dir) => (
                        <div key={dir} className="bg-muted text-muted-foreground text-xs rounded px-2 py-1">
                          {dir}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label>Дополнительные игнорируемые директории:</Label>
                  <EditableList
                    items={settings.ignoredDirectories}
                    onItemsChange={(items) => onSettingsChange({ ...settings, ignoredDirectories: items })}
                    placeholder="Введите имя директории..."
                    badgeVariant="secondary"
                  />
                </div>
              </TabsContent>

              <TabsContent value="files" className="mt-4 space-y-4">
                <Label>Игнорируемые файлы (можно использовать * как шаблон):</Label>
                <EditableList
                  items={settings.ignoredFiles}
                  onItemsChange={(items) => onSettingsChange({ ...settings, ignoredFiles: items })}
                  placeholder="Введите имя файла или шаблон..."
                  badgeVariant="destructive"
                />
              </TabsContent>

              <TabsContent value="extensions" className="mt-4 space-y-4">
                <div>
                  <Label>Игнорируемые расширения файлов:</Label>
                  <EditableList
                    items={settings.ignoredExtensions}
                    onItemsChange={(items) => onSettingsChange({ ...settings, ignoredExtensions: items })}
                    placeholder="Введите расширение (с точкой, например .js)..."
                    validateItem={(item) => item.startsWith('.')}
                    errorMessage="Расширение должно начинаться с точки (например .js)"
                    badgeVariant="destructive"
                  />
                </div>

                <div className="mt-6">
                  <Label>Разрешенные расширения файлов:</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Если указано хотя бы одно расширение, будут включены только файлы с этими расширениями
                  </p>
                  <EditableList
                    items={settings.allowedExtensions}
                    onItemsChange={(items) => onSettingsChange({ ...settings, allowedExtensions: items })}
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
            <Button onClick={() => setOpen(false)} className="bg-black text-white hover:bg-black/90">
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
