// Простая и прямолинейная версия для создания PDF
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

  // Создаем директорию для выходного файла, если она не существует
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

    // Проверяем, нужно ли игнорировать этот путь
    if (shouldIgnorePath(relativePath, config.ignorePaths)) {
      continue;
    }

    const fileContent = readFileContent(absolutePath, config.includeComments);
    doc.fontSize(14).text(`Content of ${relativePath}`, { underline: true });
    doc.moveDown();
    doc.fontSize(10).text(fileContent);

    if (config.newPageForEachFile && i < flattenedFiles.length - 1) {
      doc.addPage();
    } else if (!config.newPageForEachFile) {
      doc.moveDown(2);
    }
  }

  // Завершаем создание PDF
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