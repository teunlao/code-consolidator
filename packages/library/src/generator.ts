import * as fs from 'fs';
import * as path from 'path';

export function generateFilesStructure(outputPath: string): void {
  interface FileTree {
    [key: string]: string | FileTree;
  }

  function getAllFiles(dir: string, fileTree: FileTree = {}): FileTree {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
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
      if (typeof fileTree[key] === 'string') {
        obj += `${indent}${key}: '${fileTree[key]}',\n`;
      } else {
        obj += `${indent}${key}: {\n`;
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
