// packages/library/src/combine-files.ts

import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';

type InputFile = string | { [key: string]: string | InputFile };

interface Config {
  inputFiles: InputFile[];
  outputFile: string;
  includeComments?: boolean;
}

const baseConfig: Config = {
  inputFiles: [],
  outputFile: 'project_code.txt',
  includeComments: false,
};

export function defineConsolidatorConfig(config: Config = baseConfig) {
  return {
    generate: () => combineFiles(config),
  };
}

function readFileContent(
  filePath: string,
  includeComments: boolean = true,
): string {
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

function combineFiles(config: Config): void {
  const flattenedFiles = flattenInputFiles(config.inputFiles);
  const doc = new PDFDocument();
  const stream = fs.createWriteStream(config.outputFile);
  doc.pipe(stream);

  for (const filePath of flattenedFiles) {
    const absolutePath = path.resolve(filePath);
    const relativePath = getRelativePath(absolutePath);
    const fileContent = readFileContent(absolutePath, config.includeComments);

    doc.fontSize(14).text(`Content of ${relativePath}`, { underline: true });
    doc.moveDown();
    doc.fontSize(10).text(fileContent);
    doc.addPage();
  }

  doc.end();
  console.log(`PDF created: ${config.outputFile}`);
}
