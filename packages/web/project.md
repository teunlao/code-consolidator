# Code Consolidation Report

Generated on: 2025-07-16T12:51:07.738Z

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/app/api/file-autocomplete/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateFilePathSuggestions } from '@/server/file-autocomplete';
import { FilterSettings } from '@/server/file-system';
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');
  if (!query) {
    return NextResponse.json({ suggestions: [] });
  }
  try {
    const suggestions = await generateFilePathSuggestions(query);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error generating autocomplete suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' }, 
      { status: 500 }
    );
  }
}
export async function POST(request: Request) {
  try {
    const { query, filterSettings } = await request.json();
    if (!query) {
      return NextResponse.json({ suggestions: [] });
    }
    const suggestions = await generateFilePathSuggestions(query, filterSettings);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error generating filtered autocomplete suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' }, 
      { status: 500 }
    );
  }
}
```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/app/api/file-content/route.ts`

```typescript
import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
export async function POST(request: Request) {
  try {
    const { filePath } = await request.json();
    if (!filePath) {
      return NextResponse.json(
        { error: 'Путь к файлу не указан' }, 
        { status: 400 }
      );
    }
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Файл не найден' }, 
        { status: 404 }
      );
    }
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return NextResponse.json(
        { error: 'Указанный путь не является файлом' }, 
        { status: 400 }
      );
    }
    const MAX_FILE_SIZE = 5 * 1024 * 1024; 
    if (stats.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Файл слишком большой для отображения (более 5MB)' }, 
        { status: 413 }
      );
    }
    let content = fs.readFileSync(filePath, 'utf-8');
    return NextResponse.json({ content });
  } catch (error: any) {
    console.error('Error reading file:', error);
    return NextResponse.json(
      { error: `Ошибка чтения файла: ${error.message}` }, 
      { status: 500 }
    );
  }
}
```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/app/api/file-tree/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { buildFileTree } from '@/server/file-system';
import path from 'path';
export async function GET() {
  try {
    const projectDir = process.env.USER_PROJECT_DIR || process.cwd();
    const fileTree = await buildFileTree(projectDir);
    return NextResponse.json({ fileTree });
  } catch (error) {
    console.error('Error getting file tree:', error);
    return NextResponse.json({ error: 'Failed to get file tree' }, { status: 500 });
  }
}
export async function POST(request: Request) {
  try {
    const { filterSettings } = await request.json();
    const projectDir = process.env.USER_PROJECT_DIR || process.cwd();
    const fileTree = await buildFileTree(projectDir, filterSettings);
    return NextResponse.json({ fileTree });
  } catch (error) {
    console.error('Error getting file tree:', error);
    return NextResponse.json({ error: 'Failed to get file tree' }, { status: 500 });
  }
}
```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/app/api/generate-pdf/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { generatePdf } from '@/server/generate-pdf';
import { generateMarkdown } from '@/server/generate-markdown';
export async function POST(request: Request) {
  try {
    const { files, outputFile, includeComments, newPageForEachFile, useAbsolutePaths, outputFormat } = await request.json();
    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: 'No files selected' }, 
        { status: 400 }
      );
    }
    let finalOutputFile = outputFile || 'project_code';
    const extension = outputFormat === 'markdown' ? '.md' : '.pdf';
    if (!finalOutputFile.toLowerCase().endsWith(extension)) {
      finalOutputFile = finalOutputFile.replace(/\.(pdf|md)$/i, '') + extension;
    }
    let resultPath: string;
    if (outputFormat === 'markdown') {
      resultPath = await generateMarkdown({
        files,
        outputFile: finalOutputFile,
        includeComments: includeComments ?? true,
        useAbsolutePaths: useAbsolutePaths ?? true,
      });
    } else {
      resultPath = await generatePdf({
        files,
        outputFile: finalOutputFile,
        includeComments: includeComments ?? true,
        newPageForEachFile: newPageForEachFile ?? true,
        useAbsolutePaths: useAbsolutePaths ?? true
      });
    }
    return NextResponse.json({ success: true, pdfPath: resultPath });
  } catch (error) {
    console.error('Error generating output:', error);
    return NextResponse.json(
      { error: 'Failed to generate output' }, 
      { status: 500 }
    );
  }
}
```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/app/api/open-file-location/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
export async function POST(request: Request) {
  try {
    const { filePath } = await request.json();
    if (!filePath) {
      return NextResponse.json(
        { error: 'Не указан путь к файлу' }, 
        { status: 400 }
      );
    }
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Файл не найден' }, 
        { status: 404 }
      );
    }
    const platform = os.platform();
    const dirPath = path.dirname(filePath);
    let command;
    if (platform === 'darwin') {
      command = `open "${dirPath}"`;
    } else if (platform === 'win32') {
      command = `explorer "${dirPath.replace(/\
    } else {
      command = `xdg-open "${dirPath}"`;
    }
    exec(command, (error) => {
      if (error) {
        console.error('Ошибка при открытии папки:', error);
      }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Ошибка при открытии папки:', error);
    return NextResponse.json(
      { error: `Не удалось открыть папку: ${error.message}` }, 
      { status: 500 }
    );
  }
}
```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/app/layout.tsx`

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
export const metadata: Metadata = {
  title: "Code Consolidator",
  description: "UI for generating code documentation",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-gray-100">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/app/page.tsx`

```tsx
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
  const { getActiveSettings, updateActiveSettings, applySelectedFilesToTree } = useProjectsStore();
  const activeSettings = getActiveSettings();
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const { activeProjectId, activeProfileId } = useProjectsStore();
  useEffect(() => {
    const isFirstLoad = !initialLoadDone;
    fetchFileTree(activeSettings.filterSettings, isFirstLoad);
    if (!initialLoadDone) {
      setInitialLoadDone(true);
    }
  }, [
    activeSettings.filterSettings, 
    initialLoadDone, 
    activeProjectId, 
    activeProfileId
  ]);
  async function fetchFileTree(filterSettings: FilterSettings, isInitialLoad = false) {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
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
        const currentSettings = getActiveSettings();
        const treeWithSelection =
          currentSettings.selectedFiles.length > 0
            ? applySelectedFilesToTree(data.fileTree, currentSettings.selectedFiles)
            : data.fileTree;
        setFileTree(treeWithSelection);
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
      filterSettings: defaultFilterSettings,
      selectedFiles: [],
    });
    fetchFileTree(defaultFilterSettings);
  };
  const handleSelectNode = (path: string, selected: boolean) => {
    if (!fileTree) return;
    const updatedTree = updateNodeSelection(fileTree, path, selected);
    setFileTree(updatedTree);
    const selectedFiles = getSelectedFilePaths(updatedTree);
    updateActiveSettings({
      selectedFiles,
      outputFileName: '', 
    });
    setSelectedFilesCount(countSelectedFiles(updatedTree));
  };
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
  const handleBulkSelectPaths = async (paths: string[]) => {
    console.log('Получили пути для обработки:', paths);
    if (!fileTree || paths.length === 0) {
      console.warn('Дерево файлов не загружено или список путей пуст');
      return;
    }
    let updatedTree = structuredClone(fileTree) as FileNode;
    let successfullyMatched = 0;
    const notFoundPaths: string[] = [];
    for (const path of paths) {
      const normalizedPath = path.trim();
      if (!normalizedPath) continue;
      const foundNode = findNodeByPath(updatedTree, normalizedPath);
      if (foundNode) {
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
    setFileTree(null); 
    setTimeout(() => {
      setFileTree(updatedTree);
      const selectedFiles = getSelectedFilePaths(updatedTree);
      updateActiveSettings({
        selectedFiles,
      });
      setSelectedFilesCount(countSelectedFiles(updatedTree));
    }, 10); 
    console.log(`Выбрано ${successfullyMatched} из ${paths.length} указанных путей.`);
  };
  const handleSearch = (query: string) => {
    setSearchQuery(query.toLowerCase());
  };
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
  const handleSetOutputNameFromFolder = (folderName: string) => {
    const extension = activeSettings.outputFormat === 'pdf' ? '.pdf' : '.md';
    const sanitizedName = folderName.replace(/[^a-zA-Z0-9_-]/g, '_'); 
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
      {}
      <ProjectSelector />
      {}
      <ProjectInfo />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <SearchFilter onSearch={handleSearch} filterSettings={activeSettings.filterSettings} />
          {filteredTree ? (
            <FileTree data={filteredTree} onSelect={handleSelectNode} searchQuery={searchQuery} onSetOutputNameFromFolder={handleSetOutputNameFromFolder} />
          ) : (
            <div className="border border-gray-700 rounded-md p-8 text-center bg-gray-800">
              <p className="text-gray-400">Файлы не найдены</p>
            </div>
          )}
        </div>
        <div className="space-y-4">
          {}
          <div className="border border-gray-700 rounded-md p-4 space-y-3 bg-gray-800">
            {}
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
            {}
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
      {}
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
      {}
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

```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/bin/start.ts`

```typescript
#!/usr/bin/env node
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
const packageDir = path.resolve(__dirname, '../..');
function parsePort(): number {
  const args = process.argv.slice(2);
  let port = 3333; 
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--port' || args[i] === '-p') && i + 1 < args.length) {
      const portArg = Number.parseInt(args[i + 1], 10);
      if (!Number.isNaN(portArg) && portArg > 0 && portArg < 65536) {
        port = portArg;
      } else {
        console.warn(`Invalid port number: ${args[i + 1]}. Using default port 3333.`);
      }
      break;
    }
  }
  return port;
}
const PORT = parsePort() || 3333;
const nextDistDir = path.join(packageDir, '.next');
if (!fs.existsSync(nextDistDir)) {
  console.error('Error: Build files not found in the package.');
  console.error('The package may be corrupted or incorrectly installed.');
  process.exit(1);
}
async function waitForServer(url: string, maxRetries = 30, delay = 500): Promise<void> {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            reject(new Error(`Server responded with status code ${res.statusCode}`));
          }
        });
        req.on('error', (err) => {
          reject(err);
        });
        req.end();
      });
      return;
    } catch (error) {
      retries++;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error(`Server failed to start after ${maxRetries} retries`);
}
async function startApp() {
  console.log('Starting Code Consolidator UI...');
  console.log(`Starting server on port ${PORT}...`);
  const userProjectDir = process.cwd();
  console.log(`User project directory: ${userProjectDir}`);
  const appProcess = spawn('npx', ['next', 'start', '--port', PORT.toString()], {
    cwd: packageDir, 
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'production', 
      USER_PROJECT_DIR: userProjectDir, 
    },
  });
  try {
    await waitForServer(`http:
    console.log(`\n✨ Code Consolidator UI is running at http:
    console.log('Use Ctrl+C to stop the application\n');
  } catch (error) {
    console.error('Server did not start correctly:', error);
  }
  appProcess.on('close', (code) => {
    console.log(`Code Consolidator UI stopped with code ${code}`);
    process.exit(code || 0);
  });
  process.on('SIGINT', () => {
    console.log('\nStopping Code Consolidator UI...');
    appProcess.kill('SIGINT');
  });
  process.on('SIGTERM', () => {
    console.log('\nStopping Code Consolidator UI...');
    appProcess.kill('SIGTERM');
  });
}
startApp().catch((error) => {
  console.error('Failed to start the application:', error);
  process.exit(1);
});

```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/components/ui/badge.tsx`

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}
function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}
export { Badge, badgeVariants }

```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/components/ui/button.tsx`

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
export { Button, buttonVariants }
```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/components/ui/checkbox.tsx`

```tsx
"use client"
import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}
export const Checkbox = React.forwardRef<HTMLDivElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    const handleClick = () => {
      onCheckedChange?.(!checked);
    };
    return (
      <div
        ref={ref}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-gray-400 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center",
          checked && "bg-blue-500 border-blue-500 text-white",
          className
        )}
        onClick={handleClick}
      >
        {checked && <Check className="h-3 w-3 text-white" />}
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="sr-only"
          {...props}
        />
      </div>
    );
  }
)
Checkbox.displayName = "Checkbox"
```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/components/ui/dialog.tsx`

```tsx
"use client"
import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = ({
  ...props
}: DialogPrimitive.DialogPortalProps) => (
  <DialogPrimitive.Portal {...props} />
)
DialogPortal.displayName = DialogPrimitive.Portal.displayName
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg md:w-full",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName
const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"
const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName
const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName
export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/components/ui/dropdown-menu.tsx`

```tsx
"use client"
import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
const DropdownMenuGroup = DropdownMenuPrimitive.Group
const DropdownMenuPortal = DropdownMenuPrimitive.Portal
const DropdownMenuSub = DropdownMenuPrimitive.Sub
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup
const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName
const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName
const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName
const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName
const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName
const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName
const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName
const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName
const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}

```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/components/ui/input.tsx`

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"
export { Input }
```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/components/ui/label.tsx`

```tsx
"use client"
import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName
export { Label }
```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/components/ui/portal.tsx`

```tsx
"use client"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])
  return mounted ? createPortal(
    children,
    document.body
  ) : null
}
```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/components/ui/switch.tsx`

```tsx
"use client"
import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName
export { Switch }
```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/components/ui/tabs.tsx`

```tsx
"use client"
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"
const Tabs = TabsPrimitive.Root
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName
const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName
export { Tabs, TabsList, TabsTrigger, TabsContent }

```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/components/ui/textarea.tsx`

```tsx
"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"
export { Textarea }

```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/components/ui/toast.tsx`

```tsx
"use client"
import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
const ToastProvider = ToastPrimitives.Provider
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName
const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName
const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName
const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName
const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName
const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName
type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>
type ToastActionElement = React.ReactElement<typeof ToastAction>
export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/components/ui/toaster.tsx`

```tsx
"use client"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
export function Toaster() {
  const { toasts } = useToast()
  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/components/ui/tooltip.tsx`

```tsx
"use client"
import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"
const TooltipProvider = TooltipPrimitive.Provider
const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border border-gray-700 bg-gray-800/95 px-3 py-1.5 text-sm text-gray-200 shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/components/ui/use-toast.ts`

```typescript
"use client"
import * as React from "react"
import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"
const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 1000000
type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const
let count = 0
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}
type ActionType = typeof actionTypes
type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: string
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: string
    }
interface State {
  toasts: ToasterToast[]
}
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()
const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }
    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }
    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action
      if (toastId) {
        toastTimeouts.set(
          toastId,
          setTimeout(() => {
            toastTimeouts.delete(toastId)
            dispatch({
              type: actionTypes.REMOVE_TOAST,
              toastId,
            })
          }, TOAST_REMOVE_DELAY)
        )
      }
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}
const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}
type Toast = Omit<ToasterToast, "id">
function toast({ ...props }: Toast) {
  const id = genId()
  const update = (props: ToasterToast) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id })
  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })
  return {
    id,
    dismiss,
    update,
  }
}
function useToast() {
  const [state, setState] = React.useState<State>(memoryState)
  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])
  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  }
}
export { useToast, toast }
```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/components/bulk-select-dialog.tsx`

```tsx
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
  const handleApply = () => {
    setProcessing(true);
    try {
      const paths = pathsText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      console.log('Передаем пути для обработки:', paths);
      if (paths.length === 0) {
        console.warn('Список путей пуст');
        return;
      }
      onApplyPaths(paths);
      handleClose();
    } catch (error) {
      console.error('Error processing paths:', error);
    } finally {
      setProcessing(false);
    }
  };
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

```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/components/code-viewer.tsx`

```tsx
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
  const getExtension = (filePath: string): string => {
    const parts = filePath.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  };
  const getBasename = (filePath: string): string => {
    const parts = filePath.split('/');
    return parts[parts.length - 1];
  };
  const determineLanguage = (filePath: string): string => {
    const extension = getExtension(filePath);
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
  useEffect(() => {
    if (isOpen && filePath) {
      setLoading(true);
      setError(null);
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

```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/components/config-panel.tsx`

```tsx
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
  selectedFiles?: string[]; 
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
  const [bulkSelectOpen, setBulkSelectOpen] = useState<boolean>(false);
  const [exportPathsOpen, setExportPathsOpen] = useState<boolean>(false);
  const pdfPath = lastGeneratedPdfPath || '';
  const handleApplyPaths = (paths: string[]) => {
    if (onBulkSelectPaths && paths.length > 0) {
      onBulkSelectPaths(paths);
    }
  };
  const handleFormatChange = (format: string) => {
    const newFormat = format as 'pdf' | 'markdown';
    onOutputFormatChange(newFormat);
    const currentName = outputFileName.replace(/\.(pdf|md)$/i, '');
    const newExtension = newFormat === 'pdf' ? 'pdf' : 'md';
    onOutputFileNameChange(`${currentName}.${newExtension}`);
  };
  return (
    <div className="border border-gray-700 rounded-md p-4 space-y-4 bg-gray-800">
      <h2 className="text-lg font-semibold text-gray-100">Настройки генерации</h2>
      {}
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
        {}
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
        {}
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
            disabled={selectedFilesCount === 0 || !outputFileName.trim()}
            className={cn(
              "flex-1", 
              (selectedFilesCount === 0 || !outputFileName.trim()) 
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
      {}
      {onBulkSelectPaths && (
        <BulkSelectDialog
          isOpen={bulkSelectOpen}
          onClose={() => setBulkSelectOpen(false)}
          onApplyPaths={handleApplyPaths}
        />
      )}
      {}
      <ExportPathsDialog 
        isOpen={exportPathsOpen}
        onClose={() => setExportPathsOpen(false)}
        paths={selectedFiles}
      />
    </div>
  );
}
```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/components/editable-list.tsx`

```tsx
'use client';
import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
interface EditableListProps {
  items: string[];
  onItemsChange: (items: string[]) => void;
  placeholder?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive';
  validateItem?: (item: string) => boolean;
  errorMessage?: string;
}
export function EditableList({
  items,
  onItemsChange,
  placeholder = 'Add item...',
  badgeVariant = 'default',
  validateItem,
  errorMessage = 'Invalid input',
}: EditableListProps) {
  const [newItem, setNewItem] = useState('');
  const [error, setError] = useState<string | null>(null);
  const handleAddItem = () => {
    if (!newItem.trim()) {
      return;
    }
    if (validateItem && !validateItem(newItem)) {
      setError(errorMessage);
      return;
    }
    setError(null);
    onItemsChange([...items, newItem.trim()]);
    setNewItem('');
  };
  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    onItemsChange(newItems);
  };
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    }
  };
  const getBadgeClass = () => {
    switch (badgeVariant) {
      case 'secondary':
        return 'bg-gray-700 text-gray-200 hover:bg-gray-600';
      case 'destructive':
        return 'bg-red-900/40 text-red-300 hover:bg-red-900/60';
      default:
        return 'bg-blue-900/40 text-blue-300 hover:bg-blue-900/60';
    }
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2 mt-2 mb-3">
        {items.map((item, index) => (
          <div
            key={index}
            className={`inline-flex items-center rounded px-2 py-1 text-xs ${getBadgeClass()}`}
          >
            {item}
            <button
              type="button"
              onClick={() => handleRemoveItem(index)}
              className="ml-2 text-gray-400 hover:text-gray-200"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-sm text-gray-500 italic">Список пуст</div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={newItem}
          onChange={(e) => {
            setNewItem(e.target.value);
            if (error) {
              setError(null);
            }
          }}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          className="border-gray-700 bg-gray-700 text-gray-200 placeholder:text-gray-500"
        />
        <Button
          type="button"
          onClick={handleAddItem}
          disabled={!newItem.trim()}
          variant="outline"
          size="icon"
          className="bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/components/export-paths-dialog.tsx`

```tsx
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
  const plainPaths = paths.join('\n');
  const jsonPaths = JSON.stringify(paths, null, 2);
  const csvPaths = paths.map(path => `"${path.replace(/"/g, '""')}"`).join('\n');
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  const handleDownload = (content: string, fileType: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    let fileName = 'selected_paths';
    if (fileType === 'json') fileName += '.json';
    else if (fileType === 'csv') fileName += '.csv';
    else fileName += '.txt';
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };
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

```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/components/file-tree.tsx`

```tsx
'use client';
import { Checkbox } from '@/components/ui/checkbox';
import { formatFileSize } from '@/lib/format-utils';
import type { FileNode } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, File, Folder, ClipboardEdit } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { CodeViewer } from './code-viewer';
interface FileTreeProps {
  data: FileNode;
  onSelect: (path: string, selected: boolean) => void;
  searchQuery?: string; 
  onSetOutputNameFromFolder: (folderName: string) => void; 
}
import { useLocalStorage } from '@/lib/hooks/use-local-storage';
export function FileTree({ data, onSelect, searchQuery, onSetOutputNameFromFolder }: FileTreeProps) {
  const [expanded, setExpanded] = useLocalStorage<Record<string, boolean>>("file-tree-expanded-state", {});
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [codeViewerOpen, setCodeViewerOpen] = useState<boolean>(false);
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);
  const AUTO_EXPAND_THRESHOLD = 10;
  const toggleExpand = (path: string) => {
    setExpanded((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };
  const countSearchMatches = (node: FileNode, query: string): number => {
    if (!query) return 0;
    let count = 0;
    if (node.name.toLowerCase().includes(query.toLowerCase())) {
      count++;
    }
    if (node.children) {
      node.children.forEach((child) => {
        count += countSearchMatches(child, query);
      });
    }
    return count;
  };
  const expandMatchingFolders = (node: FileNode, query: string, paths: string[] = []): string[] => {
    if (!query || node.type !== 'directory' || !node.children) return paths;
    let hasMatches = false;
    for (const child of node.children) {
      if (child.name.toLowerCase().includes(query.toLowerCase())) {
        hasMatches = true;
      }
      if (child.type === 'directory' && child.children) {
        const childPaths = expandMatchingFolders(child, query, []);
        if (childPaths.length > 0) {
          hasMatches = true;
          paths = [...paths, ...childPaths];
        }
      }
    }
    if (hasMatches) {
      paths.push(node.path);
    }
    return paths;
  };
  const handleSelectChange = (node: FileNode, checked: boolean) => {
    onSelect(node.path, checked);
  };
  useEffect(() => {
    return () => {
      if (clickTimer) {
        clearTimeout(clickTimer);
      }
    };
  }, [clickTimer]);
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      return;
    }
    const matchesCount = countSearchMatches(data, searchQuery);
    if (matchesCount > AUTO_EXPAND_THRESHOLD) {
      console.log(
        `Найдено ${matchesCount} совпадений, превышен порог автоматического раскрытия (${AUTO_EXPAND_THRESHOLD})`,
      );
      return;
    }
    const pathsToExpand = expandMatchingFolders(data, searchQuery);
    if (pathsToExpand.length > 0) {
      setExpanded((prev) => {
        const newExpanded = { ...prev };
        pathsToExpand.forEach((path) => {
          newExpanded[path] = true;
        });
        return newExpanded;
      });
    }
  }, [searchQuery, data]);
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
  const hasSelectedDescendants = (node: FileNode): boolean => {
    if (node.type === 'file') {
      return node.selected || false;
    }
    if (node.children) {
      return node.children.some(child => hasSelectedDescendants(child));
    }
    return false;
  };
  const countSelectedFiles = (node: FileNode): number => {
    if (node.type === 'file') {
      return node.selected ? 1 : 0;
    }
    if (node.children) {
      return node.children.reduce((acc, child) => acc + countSelectedFiles(child), 0);
    }
    return 0;
  };
  const renderNode = (node: FileNode, depth = 0, isLastChild = false, parentIsLast: boolean[] = []) => {
    const isExpanded = expanded[node.path];
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const directorySize = node.type === 'directory' ? calculateDirectorySize(node) : undefined;
    const containsSelectedFiles = node.type === 'directory' && hasSelectedDescendants(node);
    const selectedFilesCount = node.type === 'directory' ? countSelectedFiles(node) : 0;
    const renderTreeLines = () => {
      if (depth === 0) return null;
      return (
        <div className="absolute left-0 top-0 bottom-0" style={{ width: `${(depth + 1) * 12}px` }}>
          {parentIsLast.map(
            (isLast, index) =>
              !isLast &&
              index > 0 && (
                <div
                  key={index}
                  className="absolute border-l border-gray-700"
                  style={{
                    left: `${(index) * 12 + 6}px`,
                    top: 0,
                    bottom: 0,
                  }}
                />
              ),
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
        {}
        <div
          className={cn(
            'group flex items-center py-1 hover:bg-gray-700/70 rounded-sm px-2 cursor-pointer z-10 relative transition-colors duration-200',
            node.selected && 'bg-blue-800/20 border-l-2 border-blue-400',
            !node.selected && !isExpanded && containsSelectedFiles && 'border-l-2 border-blue-400',
            !node.selected && containsSelectedFiles && 'text-blue-100',
            depth === 0 && 'mt-1',
            node.type === 'directory' && 'font-medium',
            node.type === 'file' && node.selected && 'text-blue-100',
          )}
          style={{ paddingLeft: `${(depth + 1) * 12 + 4}px` }}
          onClick={(e) => {
            const isCheckboxClick =
              (e.target as HTMLElement).getAttribute('role') === 'checkbox' ||
              (e.target as HTMLElement).closest('[role="checkbox"]') ||
              (e.target as HTMLElement).closest('button');
            if (isCheckboxClick) {
              return;
            }
            if (node.type === 'directory') {
              toggleExpand(node.path);
              return;
            }
            if (node.type === 'file') {
              if (clickTimer) {
                clearTimeout(clickTimer);
              }
              const timer = setTimeout(() => {
                handleSelectChange(node, !node.selected);
                setClickTimer(null);
              }, 250); 
              setClickTimer(timer);
            }
          }}
          onDoubleClick={() => {
            if (node.type === 'file') {
              if (clickTimer) {
                clearTimeout(clickTimer);
                setClickTimer(null);
              }
              handleDoubleClick(node);
            }
          }}
        >
          <div
            onClick={(e) => {
              e.stopPropagation(); 
            }}
            onDoubleClick={(e) => {
              e.stopPropagation(); 
            }}
            className="cursor-pointer"
          >
            <Checkbox
              id={node.path}
              checked={node.selected}
              onCheckedChange={(checked: boolean | 'indeterminate') => handleSelectChange(node, checked === true)}
              className="mr-2 border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
          </div>
          {}
          <div className="w-4 h-4 mr-2 flex items-center justify-center flex-shrink-0">
            {node.type === 'directory' &&
              hasChildren &&
              (isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              ))}
          </div>
          {}
          <div className="w-5 h-4 flex items-center justify-center flex-shrink-0 mr-2">
            {node.type === 'directory' ? (
              <Folder className="h-4 w-4 text-blue-400" />
            ) : (
              <File className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <span className="mr-2 text-sm text-gray-200">{node.name}</span>
          {}
          <div className="ml-auto flex items-center gap-2">
            {}
            {node.type === 'directory' && (
              <button
                type="button"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-200"
                title="Использовать имя папки для выходного файла"
                onClick={(e) => {
                  e.stopPropagation(); 
                  onSetOutputNameFromFolder(node.name);
                }}
              >
                <ClipboardEdit className="h-4 w-4" />
              </button>
            )}
            {}
            {node.type === 'directory' && selectedFilesCount > 0 && (
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                isExpanded ? "bg-blue-800/30 text-blue-300" : "bg-blue-600/50 text-blue-100"
              )}>
                {selectedFilesCount}
              </span>
            )}
            {}
            {node.type === 'file' && node.size !== undefined && (
              <span className="text-xs text-gray-400">{formatFileSize(node.size)}</span>
            )}
            {node.type === 'directory' && directorySize !== undefined && directorySize > 0 && (
              <span className="text-xs text-gray-400">{formatFileSize(directorySize)}</span>
            )}
          </div>
        </div>
        {node.type === 'directory' && isExpanded && node.children && node.children.length > 0 && (
          <div>
            {node.children.map((child, index) => {
              const childrenLength = node.children?.length || 0;
              return renderNode(
                child,
                depth + 1,
                index === childrenLength - 1, 
                [...parentIsLast, isLastChild], 
              );
            })}
          </div>
        )}
      </div>
    );
  };
  const handleDoubleClick = (node: FileNode) => {
    if (node.type === 'file') {
      setSelectedFile(node.path);
      setCodeViewerOpen(true);
    }
  };
  return (
    <div className="overflow-y-auto max-h-[calc(100vh-250px)] border border-gray-700 rounded-md p-3 bg-gray-800/90">
      {renderNode(data, 0, true, [])}
      {}
      <CodeViewer isOpen={codeViewerOpen} onClose={() => setCodeViewerOpen(false)} filePath={selectedFile} />
    </div>
  );
}

```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/components/filter-settings.tsx`

```tsx
"use client"
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EditableList } from '@/components/editable-list';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Settings } from 'lucide-react';
import { FilterSettings } from '@/lib/types';
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
  const [localSettings, setLocalSettings] = useState<FilterSettings>({ ...settings });
  React.useEffect(() => {
    if (open) {
      setLocalSettings({ ...settings });
    }
  }, [open, settings]);
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

```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/components/open-file-button.tsx`

```tsx
'use client';
import { Button } from './ui/button';
import { ExternalLink, FolderOpen } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useState } from 'react';
import { cn } from '@/lib/utils';
interface OpenFileButtonProps {
  filePath: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showTooltip?: boolean;
  tooltipText?: string;
}
export function OpenFileButton({
  filePath,
  variant = 'outline',
  size = 'icon',
  className,
  showTooltip = true,
  tooltipText = 'Открыть местоположение файла'
}: OpenFileButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const handleOpenFile = async () => {
    if (!filePath || isLoading) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/open-file-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath }),
      });
      const data = await response.json();
      if (!data.success) {
        console.error('Ошибка при открытии файла:', data.error);
      }
    } catch (error) {
      console.error('Ошибка при вызове API:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const button = (
    <Button
      variant={variant}
      size={size}
      onClick={handleOpenFile}
      disabled={isLoading}
      className={cn(
        className,
        "transition-colors duration-200",
        variant === "ghost" && "hover:bg-gray-800/50"
      )}
      type="button"
    >
      {isLoading ? <ExternalLink className="h-4 w-4 animate-pulse" /> : <FolderOpen className="h-4 w-4" />}
    </Button>
  );
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  return button;
}

```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/components/project-info.tsx`

```tsx
'use client';
import React from 'react';
import { useProjectsStore } from '@/lib/stores/projects-store';
import { formatDate } from '@/lib/format-utils';
import { Badge } from '@/components/ui/badge';
import { Layers, Clock, FilePlus } from 'lucide-react';
export function ProjectInfo() {
  const { 
    getActiveProject, 
    getActiveProfile 
  } = useProjectsStore();
  const activeProject = getActiveProject();
  const activeProfile = getActiveProfile();
  if (!activeProject) {
    return null;
  }
  return (
    <div className="border border-gray-700 rounded-md p-3 bg-gray-800 mb-4 text-sm text-gray-300">
      <div className="flex items-center gap-2 mb-2">
        <Layers className="h-4 w-4 text-blue-400" />
        <span className="font-medium text-gray-200">{activeProject.name}</span>
        <Badge variant="outline" className="ml-auto text-xs bg-gray-700 text-gray-300 border-gray-600">
          <Clock className="h-3 w-3 mr-1" />
          {formatDate(activeProject.updatedAt)}
        </Badge>
      </div>
      {activeProject.description && (
        <p className="mb-2 text-gray-400 text-xs">{activeProject.description}</p>
      )}
      {activeProfile && (
        <div className="border-t border-gray-700 mt-2 pt-2">
          <div className="flex items-center gap-2 mb-1">
            <FilePlus className="h-4 w-4 text-green-400" />
            <span className="font-medium text-gray-200">{activeProfile.name}</span>
            <Badge variant="outline" className="ml-auto text-xs bg-gray-700 text-gray-300 border-gray-600">
              <Clock className="h-3 w-3 mr-1" />
              {formatDate(activeProfile.updatedAt)}
            </Badge>
          </div>
          {activeProfile.description && (
            <p className="text-gray-400 text-xs">{activeProfile.description}</p>
          )}
        </div>
      )}
      <div className="border-t border-gray-700 mt-2 pt-2 text-xs">
        <div className="flex gap-4">
          <div>
            <span className="text-gray-400">Комментарии:</span>{' '}
            <span className="text-gray-200">{
              activeProfile ? 
                (activeProfile.settings.includeComments ? 'Включены' : 'Исключены') : 
                (activeProject.baseSettings.includeComments ? 'Включены' : 'Исключены')
            }</span>
          </div>
          <div>
            <span className="text-gray-400">Новая страница для файла:</span>{' '}
            <span className="text-gray-200">{
              activeProfile ? 
                (activeProfile.settings.newPageForEachFile ? 'Да' : 'Нет') : 
                (activeProject.baseSettings.newPageForEachFile ? 'Да' : 'Нет')
            }</span>
          </div>
          <div>
            <span className="text-gray-400">Файл:</span>{' '}
            <span className="text-gray-200 font-mono">{
              activeProfile ? 
                activeProfile.settings.outputFileName : 
                activeProject.baseSettings.outputFileName
            }</span>
          </div>
        </div>
      </div>
    </div>
  );
}

```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/components/project-manager.tsx`

```tsx
'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Check, ChevronDown, FilePlus, FolderPlus, Pencil, Trash2, Layers, Copy } from 'lucide-react';
import { useProjectsStore, Project, Profile } from '@/lib/stores/projects-store';
export function ProjectSelector() {
  const { 
    projects, 
    activeProjectId,
    activeProfileId,
    getActiveProject,
    getActiveProfile,
    setActiveProject, 
    setActiveProfile,
    createProject: storeCreateProject,
    createProfile: storeCreateProfile,
    updateProject,
    updateProfile,
    deleteProject,
    deleteProfile,
    copyProfile: storeCopyProfile
  } = useProjectsStore();
  const activeProject = getActiveProject();
  const activeProfile = getActiveProfile();
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showNewProfileDialog, setShowNewProfileDialog] = useState(false);
  const [showEditProjectDialog, setShowEditProjectDialog] = useState(false);
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  if (projects.length === 0) {
    return (
      <div className="flex items-center gap-2 border border-gray-700 rounded-md p-3 bg-gray-800 mb-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowNewProjectDialog(true)}
          className="bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200"
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          Создать первый проект
        </Button>
        <NewProjectDialog 
          isOpen={showNewProjectDialog} 
          onClose={() => setShowNewProjectDialog(false)} 
          createProject={storeCreateProject}
        />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 border border-gray-700 rounded-md p-3 bg-gray-800 mb-4">
      <div className="flex-1 flex items-center gap-4">
        {}
        <div className="flex-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200"
              >
                <div className="flex items-center">
                  <Layers className="h-4 w-4 mr-2" />
                  {activeProject ? activeProject.name : 'Выберите проект'}
                </div>
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700 text-gray-200">
              <DropdownMenuLabel>Проекты</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700" />
              {projects.map(project => (
                <DropdownMenuItem 
                  key={project.id}
                  className="flex items-center cursor-pointer hover:bg-gray-700"
                  onClick={() => setActiveProject(project.id)}
                >
                  {activeProjectId === project.id && (
                    <Check className="h-4 w-4 mr-2 text-green-400" />
                  )}
                  <span className={activeProjectId === project.id ? "flex-1 font-medium" : "flex-1"}>
                    {project.name}
                  </span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem 
                className="flex items-center cursor-pointer hover:bg-gray-700"
                onClick={() => setShowNewProjectDialog(true)}
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Создать новый проект
              </DropdownMenuItem>
              {activeProject && (
                <>
                  <DropdownMenuItem 
                    className="flex items-center cursor-pointer hover:bg-gray-700"
                    onClick={() => setShowEditProjectDialog(true)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Редактировать проект
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {}
        {activeProject && (
          <div className="flex-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200"
                >
                  <div className="flex items-center">
                    <FilePlus className="h-4 w-4 mr-2" />
                    {activeProfile ? activeProfile.name : 'Базовые настройки'}
                  </div>
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700 text-gray-200">
                <DropdownMenuLabel>Профили</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem 
                  className="flex items-center cursor-pointer hover:bg-gray-700"
                  onClick={() => {
                    setActiveProfile(undefined);
                  }}
                >
                  {!activeProfile && (
                    <Check className="h-4 w-4 mr-2 text-green-400" />
                  )}
                  <span className={!activeProfile ? "flex-1 font-medium" : "flex-1"}>
                    Базовые настройки проекта
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-700" />
                {activeProject.profiles.map(profile => (
                  <DropdownMenuItem 
                    key={profile.id}
                    className="flex items-center cursor-pointer hover:bg-gray-700"
                    onClick={() => {
                      setActiveProfile(profile.id);
                    }}
                  >
                    {activeProfileId === profile.id && (
                      <Check className="h-4 w-4 mr-2 text-green-400" />
                    )}
                    <span className={activeProfileId === profile.id ? "flex-1 font-medium" : "flex-1"}>
                      {profile.name}
                    </span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem 
                  className="flex items-center cursor-pointer hover:bg-gray-700"
                  onClick={() => setShowNewProfileDialog(true)}
                >
                  <FilePlus className="h-4 w-4 mr-2" />
                  Создать новый профиль
                </DropdownMenuItem>
                {activeProfile && (
                  <>
                    <DropdownMenuItem 
                      className="flex items-center cursor-pointer hover:bg-gray-700"
                      onClick={() => setShowEditProfileDialog(true)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Редактировать профиль
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="flex items-center cursor-pointer hover:bg-gray-700"
                      onClick={() => {
                        if (activeProject) {
                          storeCopyProfile(activeProject.id, activeProfile.id);
                        }
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Копировать профиль
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      {}
      <NewProjectDialog 
        isOpen={showNewProjectDialog} 
        onClose={() => setShowNewProjectDialog(false)} 
        createProject={storeCreateProject}
      />
      {activeProject && (
        <>
          <EditProjectDialog 
            isOpen={showEditProjectDialog} 
            onClose={() => setShowEditProjectDialog(false)}
            project={activeProject}
            updateProject={updateProject}
            deleteProject={deleteProject}
          />
          <NewProfileDialog 
            isOpen={showNewProfileDialog} 
            onClose={() => setShowNewProfileDialog(false)}
            projectId={activeProject.id}
            createProfile={storeCreateProfile}
          />
          {activeProfile && (
            <EditProfileDialog 
              isOpen={showEditProfileDialog} 
              onClose={() => setShowEditProfileDialog(false)}
              projectId={activeProject.id}
              profile={activeProfile}
              updateProfile={updateProfile}
              deleteProfile={deleteProfile}
            />
          )}
        </>
      )}
    </div>
  );
}
interface NewProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  createProject: (name: string, description?: string) => Project;
}
function NewProjectDialog({ isOpen, onClose, createProject }: NewProjectDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const handleSubmit = () => {
    if (!name.trim()) return;
    createProject(name.trim(), description.trim() || undefined);
    setName('');
    setDescription('');
    onClose();
  };
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="bg-gray-800 border-gray-700 text-gray-100">
        <DialogHeader>
          <DialogTitle>Создать новый проект</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Название проекта</Label>
            <Input 
              id="project-name" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="bg-gray-700 border-gray-600 text-gray-200"
              placeholder="Введите название проекта"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description">Описание (опционально)</Label>
            <Textarea 
              id="project-description" 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="bg-gray-700 border-gray-600 text-gray-200 min-h-20"
              placeholder="Введите описание проекта"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200">
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
            Создать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
interface EditProjectDialogProps {
  isOpen: boolean; 
  onClose: () => void; 
  project: Project;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
}
function EditProjectDialog({ 
  isOpen, 
  onClose, 
  project,
  updateProject,
  deleteProject
}: EditProjectDialogProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const handleSubmit = () => {
    if (!name.trim()) return;
    updateProject(project.id, {
      name: name.trim(),
      description: description.trim() || undefined
    });
    onClose();
  };
  const handleDelete = () => {
    deleteProject(project.id);
    onClose();
  };
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="bg-gray-800 border-gray-700 text-gray-100">
        <DialogHeader>
          <DialogTitle>Редактировать проект</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="project-name-edit">Название проекта</Label>
            <Input 
              id="project-name-edit" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="bg-gray-700 border-gray-600 text-gray-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description-edit">Описание (опционально)</Label>
            <Textarea 
              id="project-description-edit" 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="bg-gray-700 border-gray-600 text-gray-200 min-h-20"
            />
          </div>
          {!showDeleteConfirm ? (
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteConfirm(true)} 
              className="w-full mt-4"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить проект
            </Button>
          ) : (
            <div className="border border-red-800 bg-red-900/20 rounded-md p-3 mt-4">
              <p className="text-red-300 mb-2">Вы уверены, что хотите удалить этот проект и все его профили?</p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-700 border-gray-600"
                >
                  Отмена
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  className="flex-1"
                >
                  Подтвердить удаление
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200">
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
interface NewProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  createProfile: (projectId: string, name: string, description?: string, inheritFromProject?: boolean) => Profile;
}
function NewProfileDialog({ 
  isOpen, 
  onClose, 
  projectId,
  createProfile
}: NewProfileDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [inheritSettings, setInheritSettings] = useState(true);
  const handleSubmit = () => {
    if (!name.trim()) return;
    createProfile(
      projectId, 
      name.trim(), 
      description.trim() || undefined, 
      inheritSettings
    );
    setName('');
    setDescription('');
    setInheritSettings(true);
    onClose();
  };
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="bg-gray-800 border-gray-700 text-gray-100">
        <DialogHeader>
          <DialogTitle>Создать новый профиль</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Название профиля</Label>
            <Input 
              id="profile-name" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="bg-gray-700 border-gray-600 text-gray-200"
              placeholder="Введите название профиля"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-description">Описание (опционально)</Label>
            <Textarea 
              id="profile-description" 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="bg-gray-700 border-gray-600 text-gray-200 min-h-20"
              placeholder="Введите описание профиля"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="inherit-settings"
              checked={inheritSettings}
              onCheckedChange={(checked) => setInheritSettings(checked as boolean)}
              className="border-gray-600 data-[state=checked]:bg-blue-600"
            />
            <Label htmlFor="inherit-settings" className="text-sm text-gray-300">
              Наследовать настройки из базовых настроек проекта
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200">
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
            Создать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
interface EditProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  profile: Profile;
  updateProfile: (projectId: string, profileId: string, updates: Partial<Profile>) => void;
  deleteProfile: (projectId: string, profileId: string) => void;
}
function EditProfileDialog({ 
  isOpen, 
  onClose, 
  projectId,
  profile,
  updateProfile,
  deleteProfile
}: EditProfileDialogProps) {
  const [name, setName] = useState(profile.name);
  const [description, setDescription] = useState(profile.description || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const handleSubmit = () => {
    if (!name.trim()) return;
    updateProfile(projectId, profile.id, {
      name: name.trim(),
      description: description.trim() || undefined
    });
    onClose();
  };
  const handleDelete = () => {
    deleteProfile(projectId, profile.id);
    onClose();
  };
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="bg-gray-800 border-gray-700 text-gray-100">
        <DialogHeader>
          <DialogTitle>Редактировать профиль</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name-edit">Название профиля</Label>
            <Input 
              id="profile-name-edit" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="bg-gray-700 border-gray-600 text-gray-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-description-edit">Описание (опционально)</Label>
            <Textarea 
              id="profile-description-edit" 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="bg-gray-700 border-gray-600 text-gray-200 min-h-20"
            />
          </div>
          {!showDeleteConfirm ? (
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteConfirm(true)} 
              className="w-full mt-4"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить профиль
            </Button>
          ) : (
            <div className="border border-red-800 bg-red-900/20 rounded-md p-3 mt-4">
              <p className="text-red-300 mb-2">Вы уверены, что хотите удалить этот профиль?</p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-700 border-gray-600"
                >
                  Отмена
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  className="flex-1"
                >
                  Подтвердить удаление
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200">
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
import { Checkbox } from '@/components/ui/checkbox';

```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/components/search-filter.tsx`

```tsx
'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Info, Search, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import type { FilterSettings } from '@/server/file-system';
interface SearchFilterProps {
  onSearch: (pattern: string) => void;
  filterSettings?: FilterSettings; 
}
export function SearchFilter({ onSearch, filterSettings }: SearchFilterProps) {
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedSuggestion, setFocusedSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      setIsLoading(true);
      if (filterSettings) {
        const response = await fetch('/api/file-autocomplete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            filterSettings,
          }),
        });
        const data = await response.json();
        if (data.suggestions) {
          setSuggestions(data.suggestions);
        }
      } else {
        const response = await fetch(`/api/file-autocomplete?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        if (data.suggestions) {
          setSuggestions(data.suggestions);
        }
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    setFocusedSuggestion(-1);
    if (value.length >= 2) {
      setShowSuggestions(true);
      fetchSuggestions(value);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };
  const handleSelectSuggestion = (suggestion: string) => {
    const fileName = suggestion.split('/').pop() || suggestion;
    setSearchValue(fileName);
    setShowSuggestions(false);
    onSearch(fileName);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedSuggestion(prev => {
          const next = prev + 1 >= suggestions.length ? 0 : prev + 1;
          setTimeout(() => scrollToSuggestion(next), 0);
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedSuggestion(prev => {
          const next = prev - 1 < 0 ? suggestions.length - 1 : prev - 1;
          setTimeout(() => scrollToSuggestion(next), 0);
          return next;
        });
      } else if (e.key === 'Enter' && focusedSuggestion >= 0) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[focusedSuggestion]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
      }
    }
  };
  const scrollToSuggestion = (index: number) => {
    if (suggestionsRef.current && suggestionsRef.current.children[index]) {
      const element = suggestionsRef.current.children[index] as HTMLElement;
      const container = suggestionsRef.current;
      const elementTop = element.offsetTop;
      const elementBottom = elementTop + element.clientHeight;
      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.clientHeight;
      if (elementTop < containerTop) {
        container.scrollTop = elementTop;
      }
      else if (elementBottom > containerBottom) {
        container.scrollTop = elementBottom - container.clientHeight;
      }
    }
  };
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    onSearch(searchValue);
  };
  const handleClear = () => {
    setSearchValue('');
    setShowSuggestions(false);
    setSuggestions([]);
    onSearch('');
    inputRef.current?.focus();
  };
  const formatSuggestion = (path: string, index: number) => {
    const segments = path.split('/');
    const lastSegment = segments.pop() || path;
    const parentPath = segments.length > 0 ? segments.join('/') : '';
    const isSelected = index === focusedSuggestion;
    return (
      <div className="flex flex-col w-full">
        <span className="font-medium">{lastSegment}</span>
        {parentPath && (
          <span 
            className={`text-xs truncate ${
              isSelected ? 'text-blue-100' : 'text-gray-500'
            }`}
            style={{ 
              opacity: isSelected ? 0.9 : 0.7 
            }}
          >
            {parentPath}
          </span>
        )}
      </div>
    );
  };
  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Поиск файлов..."
          value={searchValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchValue.length >= 2) {
              setShowSuggestions(true);
              fetchSuggestions(searchValue);
            }
          }}
          className="pl-9 pr-9 border-gray-700 text-gray-200 focus:ring-blue-500 focus:border-blue-500"
          style={{ backgroundColor: '#1f2937' }}
        />
        {searchValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {}
        {}
        {showSuggestions && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border border-gray-700 shadow-lg py-1 autocomplete-dropdown"
            style={{
              backgroundColor: '#1e2030',
            }}
          >
            {isLoading ? (
              <div className="px-4 py-2 text-sm text-gray-400">Загрузка...</div>
            ) : suggestions.length > 0 ? (
              suggestions.map((suggestion, index) => (
                <div
                  key={suggestion}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  style={{
                    backgroundColor: focusedSuggestion === index ? '#2563eb' : '#1e2030',
                    position: 'relative',
                  }}
                  className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-800 ${
                    focusedSuggestion === index ? 'text-white' : 'text-gray-200'
                  }`}
                >
                  {formatSuggestion(suggestion, index)}
                </div>
              ))
            ) : (
              searchValue.length >= 2 && <div className="px-4 py-2 text-sm text-gray-400">Нет результатов</div>
            )}
          </div>
        )}
      </div>
      <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
        Найти
      </Button>
    </form>
  );
}

```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/lib/hooks/use-local-storage.ts`

```typescript
'use client';
import { useState, useEffect } from 'react';
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const readValue = (): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Ошибка чтения из localStorage для ключа "${key}":`, error);
      return initialValue;
    }
  };
  const [storedValue, setStoredValue] = useState<T>(readValue);
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Ошибка записи в localStorage для ключа "${key}":`, error);
    }
  };
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        setStoredValue(JSON.parse(event.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);
  return [storedValue, setValue];
}
```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/lib/stores/projects-store.ts`

```typescript
import type { FileNode, FilterSettings } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export interface ProjectSettings {
  includeComments: boolean;
  newPageForEachFile: boolean;
  outputFileName: string;
  useAbsolutePaths: boolean; 
  outputFormat: 'pdf' | 'markdown'; 
  filterSettings: FilterSettings;
  selectedFiles: string[]; 
}
export interface Profile {
  id: string;
  name: string;
  description?: string;
  settings: ProjectSettings;
  createdAt: number;
  updatedAt: number;
}
export interface Project {
  id: string;
  name: string;
  description?: string;
  baseSettings: ProjectSettings;
  profiles: Profile[];
  createdAt: number;
  updatedAt: number;
}
export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  includeComments: true,
  newPageForEachFile: true,
  outputFileName: 'project_code.md',
  useAbsolutePaths: true, 
  outputFormat: 'markdown', 
  filterSettings: {
    ignoredDirectories: [],
    ignoredFiles: [],
    ignoredExtensions: [],
    allowedExtensions: [],
    useDefaultIgnores: true,
  },
  selectedFiles: [],
};
interface ProjectState {
  projects: Project[];
  activeProjectId?: string;
  activeProfileId?: string;
  getActiveProject: () => Project | undefined;
  getActiveProfile: () => Profile | undefined;
  getActiveSettings: () => ProjectSettings;
  createProject: (name: string, description?: string) => Project;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  createProfile: (projectId: string, name: string, description?: string, inheritFromProject?: boolean) => Profile;
  updateProfile: (projectId: string, profileId: string, updates: Partial<Profile>) => void;
  deleteProfile: (projectId: string, profileId: string) => void;
  copyProfile: (projectId: string, profileId: string, newName?: string) => Profile;
  setActiveProject: (projectId?: string) => void;
  setActiveProfile: (profileId?: string) => void;
  updateActiveSettings: (updates: Partial<ProjectSettings>) => void;
  applySelectedFilesToTree: (fileTree: FileNode, selectedFiles: string[]) => FileNode;
}
export const useProjectsStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: undefined,
      activeProfileId: undefined,
      getActiveProject: () => {
        const { projects, activeProjectId } = get();
        return projects.find((p) => p.id === activeProjectId);
      },
      getActiveProfile: () => {
        const { activeProfileId } = get();
        const activeProject = get().getActiveProject();
        if (!activeProject || !activeProfileId) {
          return undefined;
        }
        return activeProject.profiles.find((p) => p.id === activeProfileId);
      },
      getActiveSettings: () => {
        const activeProfile = get().getActiveProfile();
        const activeProject = get().getActiveProject();
        if (activeProfile && activeProject) {
          return { 
            ...activeProject.baseSettings, 
            ...activeProfile.settings 
          };
        }
        if (activeProject) {
          return activeProject.baseSettings;
        }
        return DEFAULT_PROJECT_SETTINGS;
      },
      createProject: (name, description) => {
        const newProject: Project = {
          id: uuidv4(),
          name,
          description,
          baseSettings: { ...DEFAULT_PROJECT_SETTINGS },
          profiles: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          projects: [...state.projects, newProject],
          activeProjectId: newProject.id,
          activeProfileId: undefined,
        }));
        return newProject;
      },
      updateProject: (projectId, updates) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId ? { ...project, ...updates, updatedAt: Date.now() } : project,
          ),
        }));
      },
      deleteProject: (projectId) => {
        set((state) => {
          const updatedState: Partial<ProjectState> = {
            projects: state.projects.filter((project) => project.id !== projectId),
          };
          if (state.activeProjectId === projectId) {
            updatedState.activeProjectId = undefined;
            updatedState.activeProfileId = undefined;
          }
          return updatedState as ProjectState;
        });
      },
      createProfile: (projectId, name, description, inheritFromProject = true) => {
        const { projects } = get();
        const project = projects.find((p) => p.id === projectId);
        const settings = inheritFromProject && project 
          ? { ...project.baseSettings } 
          : { ...DEFAULT_PROJECT_SETTINGS };
        const newProfile: Profile = {
          id: uuidv4(),
          name,
          description,
          settings,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id === projectId) {
              return {
                ...project,
                profiles: [...project.profiles, newProfile],
                updatedAt: Date.now(),
              };
            }
            return project;
          }),
          activeProfileId: newProfile.id,
        }));
        return newProfile;
      },
      updateProfile: (projectId, profileId, updates) => {
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id === projectId) {
              return {
                ...project,
                profiles: project.profiles.map((profile) =>
                  profile.id === profileId ? { ...profile, ...updates, updatedAt: Date.now() } : profile,
                ),
                updatedAt: Date.now(),
              };
            }
            return project;
          }),
        }));
      },
      deleteProfile: (projectId, profileId) => {
        set((state) => {
          const updatedState: Partial<ProjectState> = {
            projects: state.projects.map((project) => {
              if (project.id === projectId) {
                return {
                  ...project,
                  profiles: project.profiles.filter((profile) => profile.id !== profileId),
                  updatedAt: Date.now(),
                };
              }
              return project;
            }),
          };
          if (state.activeProfileId === profileId) {
            updatedState.activeProfileId = undefined;
          }
          return updatedState as ProjectState;
        });
      },
      copyProfile: (projectId, profileId) => {
        const { projects } = get();
        const project = projects.find(p => p.id === projectId);
        if (!project) {
          throw new Error('Проект не найден');
        }
        const sourceProfile = project.profiles.find(p => p.id === profileId);
        if (!sourceProfile) {
          throw new Error('Профиль не найден');
        }
        const copyName = `${sourceProfile.name} (копия)`;
        const newProfile: Profile = {
          id: uuidv4(),
          name: copyName,
          description: sourceProfile.description,
          settings: { ...sourceProfile.settings },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === projectId) {
              return {
                ...p,
                profiles: [...p.profiles, newProfile],
                updatedAt: Date.now(),
              };
            }
            return p;
          }),
          activeProfileId: newProfile.id, 
        }));
        return newProfile;
      },
      setActiveProject: (projectId) => {
        set({
          activeProjectId: projectId,
          activeProfileId: undefined, 
        });
      },
      setActiveProfile: (profileId) => {
        set({ activeProfileId: profileId });
      },
      updateActiveSettings: (updates) => {
        const { activeProjectId } = get();
        const activeProfile = get().getActiveProfile();
        const activeProject = get().getActiveProject();
        if (activeProfile && activeProjectId) {
          get().updateProfile(activeProjectId, activeProfile.id, {
            settings: { ...activeProfile.settings, ...updates },
          });
        } else if (activeProject) {
          get().updateProject(activeProject.id, {
            baseSettings: { ...activeProject.baseSettings, ...updates },
          });
        }
      },
      applySelectedFilesToTree: (fileTree, selectedFiles) => {
        const filesSet = new Set(selectedFiles);
        const clonedTree = structuredClone(fileTree) as FileNode;
        const updateSelection = (node: FileNode): FileNode => {
          if (node.type === 'file') {
            return { 
              ...node, 
              selected: filesSet.has(node.path)
            };
          }
          if (node.children) {
            const updatedChildren = node.children.map(child => updateSelection(child));
            const allChildrenSelected = 
              updatedChildren.length > 0 && 
              updatedChildren.every(child => child.selected);
            return {
              ...node,
              selected: allChildrenSelected,
              children: updatedChildren,
            };
          }
          return { ...node, selected: false };
        };
        return updateSelection(clonedTree);
      },
    }),
    {
      name: 'code-consolidator-projects',
      version: 1,
    },
  ),
);
```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/lib/file-system.ts`

```typescript
'use client';
import { FileNode } from './types';
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/lib/format-utils.ts`

```typescript
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/lib/path-finder.ts`

```typescript
import { FileNode } from './types';
export function findNodeByPath(tree: FileNode, targetPath: string): FileNode | null {
  if (tree.path === targetPath) {
    return tree;
  }
  if (tree.children) {
    for (const child of tree.children) {
      const result = findNodeByPath(child, targetPath);
      if (result) {
        return result;
      }
    }
  }
  if (targetPath.includes(tree.path) || tree.path.includes(targetPath)) {
    return tree;
  }
  return null;
}
export function selectNodeAndChildren(tree: FileNode, node: FileNode, selected: boolean): FileNode {
  if (tree.path === node.path) {
    const updatedNode = { ...tree, selected };
    if (tree.type === 'directory' && tree.children) {
      updatedNode.children = tree.children.map(child => {
        const newChild = { ...child, selected };
        if (newChild.children) {
          return {
            ...newChild,
            children: newChild.children.map(grandchild => 
              selectNodeAndChildren(grandchild, grandchild, selected)
            )
          };
        }
        return newChild;
      });
    }
    return updatedNode;
  }
  if (tree.children) {
    return {
      ...tree, 
      children: tree.children.map(child => selectNodeAndChildren(child, node, selected))
    };
  }
  return tree;
}

```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/lib/projects-storage.ts`

```typescript
import { FilterSettings, FileNode } from './types';
import { v4 as uuidv4 } from 'uuid';
export interface ProjectSettings {
  includeComments: boolean;
  newPageForEachFile: boolean;
  outputFileName: string;
  filterSettings: FilterSettings;
  selectedFiles: string[]; 
}
export interface Profile {
  id: string;
  name: string;
  description?: string;
  settings: ProjectSettings;
  createdAt: number;
  updatedAt: number;
}
export interface Project {
  id: string;
  name: string;
  description?: string;
  baseSettings: ProjectSettings;
  profiles: Profile[];
  createdAt: number;
  updatedAt: number;
}
export interface ProjectsStorage {
  projects: Project[];
  activeProjectId?: string;
  activeProfileId?: string;
}
const STORAGE_KEY = 'code-consolidator-projects';
export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  includeComments: true,
  newPageForEachFile: true,
  outputFileName: 'project_code.pdf',
  filterSettings: {
    ignoredDirectories: [],
    ignoredFiles: [],
    ignoredExtensions: [],
    allowedExtensions: [],
    useDefaultIgnores: true,
  },
  selectedFiles: [],
};
export function getProjectsStorage(): ProjectsStorage {
  if (typeof window === 'undefined') {
    return { projects: [] };
  }
  const storageData = localStorage.getItem(STORAGE_KEY);
  if (!storageData) {
    return { projects: [] };
  }
  try {
    return JSON.parse(storageData) as ProjectsStorage;
  } catch (error) {
    console.error('Ошибка при чтении данных проектов:', error);
    return { projects: [] };
  }
}
export function saveProjectsStorage(data: ProjectsStorage): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
export function createProject(name: string, description?: string): Project {
  return {
    id: uuidv4(),
    name,
    description,
    baseSettings: { ...DEFAULT_PROJECT_SETTINGS },
    profiles: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
export function createProfile(
  projectId: string, 
  name: string, 
  description?: string, 
  inheritFromProject = true
): Profile {
  const storage = getProjectsStorage();
  const project = storage.projects.find(p => p.id === projectId);
  const settings = inheritFromProject && project 
    ? { ...project.baseSettings }
    : { ...DEFAULT_PROJECT_SETTINGS };
  return {
    id: uuidv4(),
    name,
    description,
    settings,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
export function getActiveProject(): Project | undefined {
  const storage = getProjectsStorage();
  if (!storage.activeProjectId) {
    return undefined;
  }
  return storage.projects.find(p => p.id === storage.activeProjectId);
}
export function getActiveProfile(): Profile | undefined {
  const storage = getProjectsStorage();
  const project = getActiveProject();
  if (!project || !storage.activeProfileId) {
    return undefined;
  }
  return project.profiles.find(p => p.id === storage.activeProfileId);
}
export function getActiveSettings(): ProjectSettings {
  const activeProfile = getActiveProfile();
  const activeProject = getActiveProject();
  if (activeProfile) {
    return activeProfile.settings;
  }
  if (activeProject) {
    return activeProject.baseSettings;
  }
  return DEFAULT_PROJECT_SETTINGS;
}
export function updateSelectedFiles(selectedFiles: string[]): void {
  const storage = getProjectsStorage();
  const activeProject = storage.activeProjectId 
    ? storage.projects.find(p => p.id === storage.activeProjectId)
    : undefined;
  if (!activeProject) return;
  const activeProfile = storage.activeProfileId && activeProject
    ? activeProject.profiles.find(p => p.id === storage.activeProfileId)
    : undefined;
  if (activeProfile) {
    storage.projects = storage.projects.map(project => {
      if (project.id === storage.activeProjectId) {
        return {
          ...project,
          profiles: project.profiles.map(profile => {
            if (profile.id === storage.activeProfileId) {
              return {
                ...profile,
                settings: { ...profile.settings, selectedFiles },
                updatedAt: Date.now(),
              };
            }
            return profile;
          }),
        };
      }
      return project;
    });
  } else if (activeProject) {
    storage.projects = storage.projects.map(project => {
      if (project.id === storage.activeProjectId) {
        return {
          ...project,
          baseSettings: { ...project.baseSettings, selectedFiles },
          updatedAt: Date.now(),
        };
      }
      return project;
    });
  }
  saveProjectsStorage(storage);
}
export function applySelectedFilesToTree(fileTree: FileNode, selectedFiles: string[]): FileNode {
  const filesSet = new Set(selectedFiles);
  const updateSelection = (node: FileNode): FileNode => {
    const selected = filesSet.has(node.path);
    if (node.type === 'file') {
      return { ...node, selected };
    }
    if (node.children) {
      const updatedChildren = node.children.map(child => updateSelection(child));
      const allChildrenSelected = updatedChildren.length > 0 && 
        updatedChildren.every(child => child.selected);
      return {
        ...node,
        selected: allChildrenSelected,
        children: updatedChildren,
      };
    }
    return node;
  };
  return updateSelection(fileTree);
}
export function updateSettings(settings: Partial<ProjectSettings>): void {
  const storage = getProjectsStorage();
  const activeProject = storage.activeProjectId 
    ? storage.projects.find(p => p.id === storage.activeProjectId)
    : undefined;
  if (!activeProject) return;
  const activeProfile = storage.activeProfileId && activeProject
    ? activeProject.profiles.find(p => p.id === storage.activeProfileId)
    : undefined;
  if (activeProfile) {
    storage.projects = storage.projects.map(project => {
      if (project.id === storage.activeProjectId) {
        return {
          ...project,
          profiles: project.profiles.map(profile => {
            if (profile.id === storage.activeProfileId) {
              return {
                ...profile,
                settings: { ...profile.settings, ...settings },
                updatedAt: Date.now(),
              };
            }
            return profile;
          }),
        };
      }
      return project;
    });
  } else if (activeProject) {
    storage.projects = storage.projects.map(project => {
      if (project.id === storage.activeProjectId) {
        return {
          ...project,
          baseSettings: { ...project.baseSettings, ...settings },
          updatedAt: Date.now(),
        };
      }
      return project;
    });
  }
  saveProjectsStorage(storage);
}

```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/lib/tree-utils.ts`

```typescript
import { FileNode } from './types';
export function updateNodeSelection(tree: FileNode, path: string, selected: boolean): FileNode {
  if (tree.path === path) {
    if (tree.type === 'directory' && tree.children) {
      return {
        ...tree,
        selected,
        children: tree.children.map(child => ({
          ...child,
          selected,
          children: child.children 
            ? child.children.map(grandchild => updateNodeSelection({ 
                ...grandchild, 
                selected 
              }, grandchild.path, selected))
            : undefined
        }))
      };
    }
    return { ...tree, selected };
  }
  if (tree.children) {
    return {
      ...tree,
      children: tree.children.map(child => updateNodeSelection(child, path, selected))
    };
  }
  return tree;
}
export function getSelectedFilePaths(node: FileNode): string[] {
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
}
export function countSelectedFiles(node: FileNode): number {
  let count = node.type === 'file' && node.selected ? 1 : 0;
  if (node.children) {
    count += node.children.reduce((acc, child) => acc + countSelectedFiles(child), 0);
  }
  return count;
}

```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/lib/types.ts`

```typescript
export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  selected?: boolean;
  children?: FileNode[];
}
export interface FilterSettings {
  ignoredDirectories: string[];
  ignoredFiles: string[];
  ignoredExtensions: string[];
  allowedExtensions: string[];
  useDefaultIgnores: boolean;
}

```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/lib/use-projects.ts`

```typescript
import { useEffect, useState } from 'react';
import { 
  Project, 
  Profile, 
  ProjectSettings,
  getProjectsStorage, 
  saveProjectsStorage,
  createProject as createProjectUtil,
  createProfile as createProfileUtil,
  DEFAULT_PROJECT_SETTINGS
} from './projects-storage';
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>();
  const [activeProfileId, setActiveProfileId] = useState<string | undefined>();
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    const storage = getProjectsStorage();
    setProjects(storage.projects);
    setActiveProjectId(storage.activeProjectId);
    setActiveProfileId(storage.activeProfileId);
    setIsLoaded(true);
  }, []);
  useEffect(() => {
    if (!isLoaded) return;
    const storage = getProjectsStorage();
    storage.projects = projects;
    storage.activeProjectId = activeProjectId;
    storage.activeProfileId = activeProfileId;
    saveProjectsStorage(storage);
  }, [projects, activeProjectId, activeProfileId, isLoaded]);
  const activeProject = activeProjectId 
    ? projects.find(p => p.id === activeProjectId) 
    : undefined;
  const activeProfile = activeProject && activeProfileId
    ? activeProject.profiles.find(p => p.id === activeProfileId)
    : undefined;
  const activeSettings = activeProfile 
    ? activeProfile.settings 
    : activeProject 
      ? activeProject.baseSettings 
      : DEFAULT_PROJECT_SETTINGS;
  const createProject = (name: string, description?: string) => {
    const newProject = createProjectUtil(name, description);
    setProjects([...projects, newProject]);
    return newProject;
  };
  const updateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects(projects.map(project => 
      project.id === projectId 
        ? { ...project, ...updates, updatedAt: Date.now() } 
        : project
    ));
  };
  const deleteProject = (projectId: string) => {
    setProjects(projects.filter(project => project.id !== projectId));
    if (activeProjectId === projectId) {
      setActiveProjectId(undefined);
      setActiveProfileId(undefined);
    }
  };
  const createProfile = (
    projectId: string, 
    name: string, 
    description?: string, 
    inheritFromProject = true
  ) => {
    const newProfile = createProfileUtil(projectId, name, description, inheritFromProject);
    setProjects(projects.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          profiles: [...project.profiles, newProfile],
          updatedAt: Date.now()
        };
      }
      return project;
    }));
    return newProfile;
  };
  const updateProfile = (projectId: string, profileId: string, updates: Partial<Profile>) => {
    setProjects(projects.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          profiles: project.profiles.map(profile => 
            profile.id === profileId 
              ? { ...profile, ...updates, updatedAt: Date.now() } 
              : profile
          ),
          updatedAt: Date.now()
        };
      }
      return project;
    }));
  };
  const deleteProfile = (projectId: string, profileId: string) => {
    setProjects(projects.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          profiles: project.profiles.filter(profile => profile.id !== profileId),
          updatedAt: Date.now()
        };
      }
      return project;
    }));
    if (activeProfileId === profileId) {
      setActiveProfileId(undefined);
    }
  };
  const setActiveProject = (projectId?: string) => {
    setActiveProjectId(projectId);
    setActiveProfileId(undefined); 
  };
  const setActiveProfile = (profileId?: string) => {
    setActiveProfileId(profileId);
  };
  const updateActiveSettings = (updates: Partial<ProjectSettings>) => {
    if (activeProfile && activeProjectId) {
      updateProfile(activeProjectId, activeProfile.id, {
        settings: { ...activeProfile.settings, ...updates }
      });
    } else if (activeProject) {
      updateProject(activeProject.id, {
        baseSettings: { ...activeProject.baseSettings, ...updates }
      });
    }
  };
  return {
    projects,
    activeProjectId,
    activeProfileId,
    activeProject,
    activeProfile,
    activeSettings,
    createProject,
    updateProject,
    deleteProject,
    createProfile,
    updateProfile,
    deleteProfile,
    setActiveProject,
    setActiveProfile,
    updateActiveSettings,
    isLoaded
  };
}

```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function setCookie(name: string, value: string, days = 365) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/;SameSite=Strict`;
}
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }
  return null;
}
export function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Strict`;
}

```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/server/core/combine-files.ts`

```typescript
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
export type InputFile = string | { [key: string]: string | InputFile };
function shouldIgnorePath(path: string, ignorePaths?: (string | RegExp)[]): boolean {
  if (!ignorePaths) {
    return false;
  }
  return ignorePaths.some((pattern) => {
    if (typeof pattern === 'string') {
      return path.includes(pattern);
    }
    if (pattern instanceof RegExp) {
      return pattern.test(path);
    }
    return false;
  });
}
export interface ConsolidatorConfig {
  inputFiles: InputFile[];
  outputFile: string;
  includeComments?: boolean;
  newPageForEachFile?: boolean;
  useAbsolutePaths?: boolean; 
  ignorePaths?: (string | RegExp)[];
}
export function defineConsolidatorConfig(config: ConsolidatorConfig) {
  return {
    generate: () => combineFiles(config),
  };
}
function readFileContent(filePath: string, includeComments = true): string {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    if (!includeComments) {
      content = removeComments(content);
    }
    return content;
  } catch (error: any) {
    console.error(`Ошибка при чтении файла ${filePath}: ${error.message}`);
    return '';
  }
}
function removeComments(content: string): string {
  return content
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\/+/g, '')
    .replace(/^\s*[\r\n]/gm, '');
}
function getRelativePath(filePath: string): string {
  const projectRoot = path.resolve('.');
  return path.relative(projectRoot, filePath);
}
function flattenInputFiles(inputFiles: InputFile[]): string[] {
  let flattenedFiles: string[] = [];
  inputFiles.forEach((file) => {
    if (typeof file === 'string') {
      flattenedFiles.push(file);
    } else if (typeof file === 'object') {
      for (const key in file) {
        const value = file[key];
        if (typeof value === 'string') {
          flattenedFiles.push(value);
        } else {
          flattenedFiles = flattenedFiles.concat(flattenInputFiles([value]));
        }
      }
    }
  });
  return flattenedFiles;
}
export async function combineFiles(config: ConsolidatorConfig): Promise<void> {
  const flattenedFiles = flattenInputFiles(config.inputFiles);
  const doc = new PDFDocument();
  const outputDir = path.dirname(config.outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const stream = fs.createWriteStream(config.outputFile);
  doc.pipe(stream);
  for (let i = 0; i < flattenedFiles.length; i++) {
    const filePath = flattenedFiles[i];
    const absolutePath = path.resolve(filePath);
    const relativePath = getRelativePath(absolutePath);
    if (shouldIgnorePath(relativePath, config.ignorePaths)) {
      continue;
    }
    const fileContent = readFileContent(absolutePath, config.includeComments);
    const displayPath = config.useAbsolutePaths ? absolutePath : relativePath;
    doc.fontSize(14).text(`Content of ${displayPath}`, { underline: true });
    doc.moveDown();
    doc.fontSize(10).text(fileContent);
    if (config.newPageForEachFile && i < flattenedFiles.length - 1) {
      doc.addPage();
    } else if (!config.newPageForEachFile) {
      doc.moveDown(2);
    }
  }
  return new Promise<void>((resolve, reject) => {
    stream.on('finish', () => {
      console.log(`PDF created: ${config.outputFile}`);
      resolve();
    });
    stream.on('error', (err) => {
      reject(err);
    });
    doc.end();
  });
}
```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/server/core/generator.ts`

```typescript
import * as fs from 'fs';
import * as path from 'path';
export function generateFilesStructure(outputPath: string): void {
  interface FileTree {
    [key: string]: string | FileTree;
  }
  const ignoredDirectories = [
    'node_modules',
    '.git',
    'dist',
    'build',
    'tmp',
    'coverage',
    'nx',
    '.nx',
    '.next',
    '.nuxt',
  ];
  const ignoredFiles = [
    '.DS_Store',
    '*.log',
    '*.tmp',
    '*.swp',
    'yarn.lock',
    'package-lock.json',
    'pnpm-lock.yaml',
    'project_files.ts',
    'out.gen.pdf',
    'project_code.txt',
    'project_code.pdf',
    'out.gen.txt',
  ];
  const ignoredExtensions = [
    '.old',
    '.svg',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.bmp',
    '.ico',
    '.webp',
    '.tiff',
    '.pdf',
    '.exe',
    '.dll',
    '.so',
    '.dylib',
    '.zip',
    '.tar',
    '.gz',
    '.rar',
    '.7z',
    '.mp3',
    '.mp4',
    '.avi',
    '.mov',
    '.wmv',
    '.flv',
    '.ttf',
    '.woff',
    '.woff2',
    '.eot',
    '.pdf',
  ];
  function shouldIgnore(file: string, stat: fs.Stats): boolean {
    if (stat.isDirectory() && ignoredDirectories.includes(file)) {
      return true;
    }
    if (stat.isFile()) {
      if (ignoredFiles.includes(file)) {
        return true;
      }
      for (const pattern of ignoredFiles) {
        if (
          new RegExp(pattern.replace(/\./g, '\\.').replace(/\*/g, '.*')).test(
            file,
          )
        ) {
          return true;
        }
      }
      const ext = path.extname(file).toLowerCase();
      if (ignoredExtensions.includes(ext)) {
        return true;
      }
    }
    return false;
  }
  function getAllFiles(dir: string, fileTree: FileTree = {}): FileTree {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (shouldIgnore(file, stat)) {
        return;
      }
      if (stat.isDirectory()) {
        fileTree[file.replace(/[^a-zA-Z0-9]/g, '_')] = getAllFiles(fullPath);
      } else {
        const key = file.replace(/[^a-zA-Z0-9]/g, '_');
        fileTree[key] = fullPath;
      }
    });
    return fileTree;
  }
  function generateObject(fileTree: FileTree, indentLevel: number = 0): string {
    let obj = '';
    const indent = ' '.repeat(indentLevel * 4);
    for (const key in fileTree) {
      const quotedKey = `"${key}"`; 
      if (typeof fileTree[key] === 'string') {
        obj += `${indent}${quotedKey}: '${fileTree[key]}',\n`;
      } else {
        obj += `${indent}${quotedKey}: {\n`;
        obj += generateObject(fileTree[key] as FileTree, indentLevel + 1);
        obj += `${indent}},\n`;
      }
    }
    return obj;
  }
  function writeObjectToFile(object: string, outputPath: string): void {
    try {
      fs.writeFileSync(
        outputPath,
        `export const projectFiles = {\n${object}};\n`,
        'utf-8',
      );
    } catch (error: any) {
      console.error(`Ошибка при записи в файл ${outputPath}: ${error.message}`);
    }
  }
  const projectRoot = path.resolve('.');
  const fileTree = getAllFiles(projectRoot);
  const object = generateObject(fileTree);
  writeObjectToFile(object, outputPath);
}
```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/server/core/index.ts`

```typescript
export { generateFilesStructure } from './generator';
export { 
  defineConsolidatorConfig, 
  combineFiles, 
  type ConsolidatorConfig,
  type InputFile
} from './combine-files';
```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/server/core/pdf-generator.ts`

```typescript
import * as fs from 'fs';
import * as path from 'path';
export interface PdfGeneratorOptions {
  outputPath: string;
}
export class PdfGenerator {
  private doc: any;
  private stream!: fs.WriteStream;
  constructor(options: PdfGeneratorOptions) {
    const outputDir = path.dirname(options.outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }
  async initialize(outputPath: string): Promise<void> {
    try {
      const pdfkit = await import('pdfkit').catch(e => {
        console.error('Error importing pdfkit:', e);
        throw e;
      });
      this.doc = new pdfkit.default();
      this.stream = fs.createWriteStream(outputPath);
      this.doc.pipe(this.stream);
    } catch (error) {
      console.error('Ошибка при инициализации PDF:', error);
      throw error;
    }
  }
  addHeading(text: string): void {
    this.doc.fontSize(14).text(text, { underline: true });
    this.doc.moveDown();
  }
  addContent(text: string): void {
    this.doc.fontSize(10).text(text);
  }
  addNewPage(): void {
    this.doc.addPage();
  }
  addSpace(lines: number = 2): void {
    this.doc.moveDown(lines);
  }
  async end(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.stream.on('finish', () => {
        resolve();
      });
      this.stream.on('error', (err) => {
        reject(err);
      });
      this.doc.end();
    });
  }
}
```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/server/file-autocomplete.ts`

```typescript
import { FileNode } from '@/lib/types';
import { buildFileTree, FilterSettings, shouldIgnore } from './file-system';
import * as fs from 'fs';
import * as path from 'path';
const MAX_SUGGESTIONS = 15;
export async function generateFilePathSuggestions(
  query: string, 
  filterSettings?: FilterSettings
): Promise<string[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }
  const normalizedQuery = query.toLowerCase();
  try {
    const projectDir = process.env.USER_PROJECT_DIR || process.cwd();
    const fileTree = await buildFileTree(projectDir, filterSettings);
    const allPaths = extractPaths(fileTree);
    if (!allPaths || !Array.isArray(allPaths)) {
      return [];
    }
    const matchingPaths = allPaths
      .filter(path => {
        const lastSegment = getLastPathSegment(path);
        return lastSegment.toLowerCase().includes(normalizedQuery);
      })
      .sort((a, b) => {
        const aLastSegment = getLastPathSegment(a);
        const bLastSegment = getLastPathSegment(b);
        const aStartsWithQuery = aLastSegment.toLowerCase().startsWith(normalizedQuery);
        const bStartsWithQuery = bLastSegment.toLowerCase().startsWith(normalizedQuery);
        if (aStartsWithQuery && !bStartsWithQuery) return -1;
        if (!aStartsWithQuery && bStartsWithQuery) return 1;
        return a.length - b.length;
      })
      .slice(0, MAX_SUGGESTIONS);
    return matchingPaths;
  } catch (error) {
    console.error('Error generating autocomplete suggestions:', error);
    return [];
  }
}
function extractPaths(node: FileNode): string[] {
  let paths: string[] = [];
  paths.push(node.path);
  if (node.children) {
    node.children.forEach(child => {
      paths = [...paths, ...extractPaths(child)];
    });
  }
  return paths;
}
function getLastPathSegment(path: string): string {
  const segments = path.split('/');
  return segments[segments.length - 1];
}
```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/server/file-system.ts`

```typescript
import * as fs from 'fs';
import * as path from 'path';
export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
  selected?: boolean;
}
export interface FilterSettings {
  ignoredDirectories: string[];
  ignoredFiles: string[];
  ignoredExtensions: string[];
  allowedExtensions: string[];
  useDefaultIgnores: boolean;
}
const DEFAULT_IGNORED_DIRECTORIES = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'tmp',
  'coverage',
  'nx',
  '.nx',
  '.next',
  '.nuxt',
];
const DEFAULT_IGNORED_FILES = [
  '.DS_Store',
  '*.log',
  '*.tmp',
  '*.swp',
  'yarn.lock',
  'package-lock.json',
  'pnpm-lock.yaml',
  'project_files.ts',
  'out.gen.pdf',
  'project_code.txt',
  'project_code.pdf',
  'out.gen.txt',
];
const DEFAULT_IGNORED_EXTENSIONS = [
  '.old',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.bmp',
  '.ico',
  '.webp',
  '.tiff',
  '.pdf',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.zip',
  '.tar',
  '.gz',
  '.rar',
  '.7z',
  '.mp3',
  '.mp4',
  '.avi',
  '.mov',
  '.wmv',
  '.flv',
  '.ttf',
  '.woff',
  '.woff2',
  '.eot',
  '.pdf',
];
export function shouldIgnore(filePath: string, stats: fs.Stats, settings?: FilterSettings): boolean {
  const baseName = path.basename(filePath);
  const ext = path.extname(baseName).toLowerCase();
  const ignoredDirs = settings?.useDefaultIgnores 
    ? [...DEFAULT_IGNORED_DIRECTORIES, ...(settings?.ignoredDirectories || [])]
    : settings?.ignoredDirectories || [];
  const ignoredFiles = settings?.useDefaultIgnores
    ? [...DEFAULT_IGNORED_FILES, ...(settings?.ignoredFiles || [])]
    : settings?.ignoredFiles || [];
  const ignoredExts = settings?.useDefaultIgnores
    ? [...DEFAULT_IGNORED_EXTENSIONS, ...(settings?.ignoredExtensions || [])]
    : settings?.ignoredExtensions || [];
  const allowedExts = settings?.allowedExtensions || [];
  if (stats.isDirectory() && ignoredDirs.includes(baseName)) {
    return true;
  }
  if (stats.isFile()) {
    if (ignoredFiles.includes(baseName)) {
      return true;
    }
    for (const pattern of ignoredFiles) {
      if (pattern.includes('*') && 
          new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\./g, '\\.') + '$').test(baseName)) {
        return true;
      }
    }
    if (ignoredExts.includes(ext)) {
      return true;
    }
    if (allowedExts.length > 0 && !allowedExts.includes(ext)) {
      return true;
    }
  }
  return false;
}
export function getFileSize(filePath: string): number {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    console.error(`Error getting file size for ${filePath}:`, error);
    return 0;
  }
}
export async function buildFileTree(dirPath: string, settings?: FilterSettings): Promise<FileNode> {
  try {
    const stats = fs.statSync(dirPath);
    const name = path.basename(dirPath);
    if (stats.isFile()) {
      return {
        name,
        path: dirPath,
        type: 'file',
        size: stats.size,
        selected: false
      };
    }
    if (stats.isDirectory()) {
      const children: FileNode[] = [];
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const fileStats = fs.statSync(filePath);
        if (!shouldIgnore(filePath, fileStats, settings)) {
          try {
            const node = await buildFileTree(filePath, settings);
            children.push(node);
          } catch (error) {
            console.error(`Error processing ${filePath}:`, error);
          }
        }
      }
      children.sort((a, b) => {
        if (a.type === 'directory' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
      });
      return {
        name,
        path: dirPath,
        type: 'directory',
        children,
        selected: false
      };
    }
    throw new Error(`Unknown file type for ${dirPath}`);
  } catch (error) {
    console.error(`Error building file tree for ${dirPath}:`, error);
    throw error;
  }
}
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/server/generate-markdown.ts`

```typescript
import path from 'path';
import fs from 'fs/promises';
const getExtension = (filePath: string): string => {
  const parts = filePath.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};
const determineLanguage = (filePath: string): string => {
  const extension = getExtension(filePath);
  const extensionMap: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    tsx: 'tsx',
    jsx: 'jsx',
    py: 'python',
    java: 'java',
    html: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    json: 'json',
    md: 'markdown',
    sh: 'bash',
    go: 'go',
    rs: 'rust',
    php: 'php',
    rb: 'ruby',
    c: 'c',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    h: 'c',
    hpp: 'cpp',
    cs: 'csharp',
    kt: 'kotlin',
    swift: 'swift',
    sql: 'sql',
    xml: 'xml',
    yml: 'yaml',
    yaml: 'yaml',
    toml: 'toml',
    ini: 'ini',
    dockerfile: 'dockerfile',
    vue: 'vue',
    svelte: 'svelte',
  };
  return extensionMap[extension] || '';
};
interface GenerateMarkdownOptions {
  files: string[];
  outputFile: string;
  includeComments: boolean;
  useAbsolutePaths: boolean;
}
function removeComments(content: string): string {
  return content
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\/+/g, '')
    .replace(/^\s*[\r\n]/gm, '');
}
async function readFileContent(filePath: string, includeComments: boolean): Promise<string> {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    if (!includeComments) {
      content = removeComments(content);
    }
    return content;
  } catch (error: any) {
    console.error(`Ошибка при чтении файла ${filePath}: ${error.message}`);
    return '';
  }
}
export async function generateMarkdown({
  files,
  outputFile,
  includeComments,
  useAbsolutePaths,
}: GenerateMarkdownOptions): Promise<string> {
  let markdownContent = '# Code Consolidation Report\n\n';
  markdownContent += `Generated on: ${new Date().toISOString()}\n\n`;
  const userProjectDir = process.env.USER_PROJECT_DIR || process.cwd();
  for (const file of files) {
    const absolutePath = path.resolve(userProjectDir, file);
    const displayPath = useAbsolutePaths ? absolutePath : path.relative(userProjectDir, absolutePath);
    const language = determineLanguage(file);
    markdownContent += `## Content of \`${displayPath}\`\n\n`;
    markdownContent += `\`\`\`${language}\n`;
    const fileContent = await readFileContent(absolutePath, includeComments);
    markdownContent += fileContent;
    markdownContent += '\n```\n\n';
  }
  const absoluteOutputPath = path.isAbsolute(outputFile) ? outputFile : path.resolve(userProjectDir, outputFile);
  const outputDir = path.dirname(absoluteOutputPath);
  try {
    await fs.mkdir(outputDir, { recursive: true });
  } catch (error) {
  }
  await fs.writeFile(absoluteOutputPath, markdownContent, 'utf-8');
  console.log(`Markdown file created: ${absoluteOutputPath}`);
  return absoluteOutputPath;
}

```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/server/generate-pdf.ts`

```typescript
import { defineConsolidatorConfig } from './core';
import path from 'path';
interface GeneratePdfOptions {
  files: string[];
  outputFile: string;
  includeComments: boolean;
  newPageForEachFile: boolean;
  useAbsolutePaths: boolean; 
}
export async function generatePdf({
  files,
  outputFile,
  includeComments,
  newPageForEachFile,
  useAbsolutePaths
}: GeneratePdfOptions): Promise<string> {
  try {
    let outputPath = outputFile;
    if (!outputPath.toLowerCase().endsWith('.pdf')) {
      outputPath += '.pdf';
    }
    const userProjectDir = process.env.USER_PROJECT_DIR || process.cwd();
    const absoluteOutputPath = path.isAbsolute(outputPath) 
      ? outputPath 
      : path.resolve(userProjectDir, outputPath);
    const config = defineConsolidatorConfig({
      inputFiles: files,
      outputFile: absoluteOutputPath,
      includeComments,
      newPageForEachFile,
      useAbsolutePaths
    });
    await config.generate();
    return absoluteOutputPath;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/src/types/pdfkit.d.ts`

```typescript
declare module 'pdfkit' {
  class PDFDocument {
    constructor(options?: any);
    pipe(stream: any): any;
    text(text: string, options?: any): this;
    fontSize(size: number): this;
    moveDown(lines?: number): this;
    addPage(): this;
    end(): void;
  }
  export default PDFDocument;
}
```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/next-env.d.ts`

```typescript

```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/next.config.js`

```javascript
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['class-variance-authority', 'clsx', 'tailwind-merge', 'lucide-react'],
  serverExternalPackages: ['fs', 'path', 'pdfkit'],
  experimental: {
    externalDir: true,
  },
};
module.exports = nextConfig;

```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/postcss.config.js`

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

## Content of `/Users/teunlao/projects/code-consolidator/packages/web/tailwind.config.js`

```javascript
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages*.{js,ts,jsx,tsx,mdx}',
    './src/components*.{js,ts,jsx,tsx,mdx}',
    './src/app*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

