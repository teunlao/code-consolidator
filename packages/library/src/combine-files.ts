import * as fs from 'fs';
import * as path from 'path';

interface Config {
  inputFiles: string[];
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
function writeToFile(content: string, outputPath: string): void {
  try {
    fs.writeFileSync(outputPath, content, 'utf-8');
  } catch (error: any) {
    console.error(`Ошибка при записи в файл ${outputPath}: ${error.message}`);
  }
}
function getRelativePath(filePath: string): string {
  const projectRoot = path.resolve('.');
  return path.relative(projectRoot, filePath);
}
function combineFiles(config: Config): void {
  let combinedContent = '';
  for (const filePath of config.inputFiles) {
    const absolutePath = path.resolve(filePath);
    const relativePath = getRelativePath(absolutePath);
    const fileContent = readFileContent(absolutePath, config.includeComments);
    combinedContent += `\n|------------ Content of ${relativePath} -------------|\n\n${fileContent}\n`;
  }
  writeToFile(combinedContent, config.outputFile);
}
