// Переименуем файл index.ts в combineFiles.ts

// combineFiles.ts
import * as fs from 'fs';
import * as path from 'path';
import { projectFiles } from '../../../project_files';
interface Config {
  inputFiles: string[];
  outputFile: string;
  includeComments?: boolean;
}
const config: Config = {
  inputFiles: [
    projectFiles._editorconfig,
    projectFiles.tsconfig_json,
    projectFiles.package_json,
    projectFiles._eslintrc_js,
    projectFiles._prettierrc,
    projectFiles.packages.library.src.combine_files_ts,
    projectFiles.packages.library.src.generator_ts,
    projectFiles.packages.library.src.index_ts,
    projectFiles.packages.library.packages_json,
    projectFiles.packages.playground.packages_json,
    projectFiles.packages.playground.src.index_ts
  ],
  outputFile: 'project_code.txt',
  includeComments: false,
};
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
  } catch (error) {
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
  } catch (error) {
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
combineFiles(config);
