import { defineConsolidatorConfig } from './core';
import path from 'path';

interface GeneratePdfOptions {
  files: string[];
  outputFile: string;
  includeComments: boolean;
  newPageForEachFile: boolean;
  useAbsolutePaths: boolean; // Новый параметр
}

export async function generatePdf({
  files,
  outputFile,
  includeComments,
  newPageForEachFile,
  useAbsolutePaths
}: GeneratePdfOptions): Promise<string> {
  try {
    // Обеспечиваем правильное расширение файла
    let outputPath = outputFile;
    if (!outputPath.toLowerCase().endsWith('.pdf')) {
      outputPath += '.pdf';
    }
    
    // Используем директорию проекта пользователя из переменной окружения
    const userProjectDir = process.env.USER_PROJECT_DIR || process.cwd();
    
    // Получаем абсолютный путь для выходного файла
    const absoluteOutputPath = path.isAbsolute(outputPath) 
      ? outputPath 
      : path.resolve(userProjectDir, outputPath);
    
    // Создаем конфигурацию и генерируем PDF
    const config = defineConsolidatorConfig({
      inputFiles: files,
      outputFile: absoluteOutputPath,
      includeComments,
      newPageForEachFile,
      useAbsolutePaths
    });
    
    // Генерируем PDF
    await config.generate();
    
    return absoluteOutputPath;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}