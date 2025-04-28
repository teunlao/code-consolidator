// Используем путь через алиас @teunlao/code-consolidator
import path from 'path';

// Определяем интерфейс, соответствующий API библиотеки
interface ConsolidatorConfig {
  inputFiles: string[];
  outputFile: string;
  includeComments?: boolean;
  newPageForEachFile?: boolean;
}

interface Consolidator {
  generate: () => Promise<void>;
}

// Создадим типизированную обертку для библиотеки
function defineConsolidatorConfig(config: ConsolidatorConfig): Consolidator {
  // Здесь будем использовать фактическую библиотеку после импорта
  // Вызываем импорт динамически, чтобы избежать ошибок при типизации
  const { defineConsolidatorConfig: actualDefineConfig } = require('@teunlao/code-consolidator');
  return actualDefineConfig(config);
}

interface GeneratePdfOptions {
  files: string[];
  outputFile: string;
  includeComments: boolean;
  newPageForEachFile: boolean;
}

export async function generatePdf({
  files,
  outputFile,
  includeComments,
  newPageForEachFile
}: GeneratePdfOptions): Promise<string> {
  try {
    // Обеспечиваем правильное расширение файла
    let outputPath = outputFile;
    if (!outputPath.toLowerCase().endsWith('.pdf')) {
      outputPath += '.pdf';
    }
    
    // Получаем абсолютный путь для выходного файла
    const absoluteOutputPath = path.isAbsolute(outputPath) 
      ? outputPath 
      : path.resolve(process.cwd(), outputPath);
    
    // Создаем конфигурацию и генерируем PDF
    const config = defineConsolidatorConfig({
      inputFiles: files,
      outputFile: absoluteOutputPath,
      includeComments,
      newPageForEachFile
    });
    
    // Генерируем PDF
    await config.generate();
    
    return absoluteOutputPath;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}