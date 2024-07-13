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
  ];
  const ignoredFiles = [
    '.DS_Store',
    '*.log',
    '*.tmp',
    '*.swp',
    'yarn.lock',
    'package-lock.json',
    'pnpm-lock.yaml',
  ];

  function shouldIgnore(file: string, stat: fs.Stats): boolean {
    if (stat.isDirectory() && ignoredDirectories.includes(file)) {
      return true;
    }
    if (stat.isFile()) {
      // Проверка на полное совпадение
      if (ignoredFiles.includes(file)) {
        return true;
      }
      // Проверка на шаблоны
      for (const pattern of ignoredFiles) {
        if (
          new RegExp(pattern.replace(/\./g, '\\.').replace(/\*/g, '.*')).test(
            file,
          )
        ) {
          return true;
        }
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
      const quotedKey = `"${key}"`; // Ключ в кавычках
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
