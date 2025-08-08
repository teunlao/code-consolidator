import path from 'path';
import fs from 'fs/promises';
import archiver from 'archiver';
import { createWriteStream } from 'fs';

interface GenerateZipOptions {
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

export async function generateZip({
  files,
  outputFile,
  includeComments,
  useAbsolutePaths,
}: GenerateZipOptions): Promise<string> {
  try {
    // Обеспечиваем правильное расширение файла
    let outputPath = outputFile;
    if (!outputPath.toLowerCase().endsWith('.zip')) {
      outputPath += '.zip';
    }
    
    // Используем директорию проекта пользователя из переменной окружения
    const userProjectDir = process.env.USER_PROJECT_DIR || process.cwd();
    
    // Получаем абсолютный путь для выходного файла
    const absoluteOutputPath = path.isAbsolute(outputPath) 
      ? outputPath 
      : path.resolve(userProjectDir, outputPath);
    
    // Создаем директорию для выходного файла, если она не существует
    const outputDir = path.dirname(absoluteOutputPath);
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (error) {
      // Игнорируем ошибку, если директория уже существует
    }

    // Создаем ZIP архив
    const output = createWriteStream(absoluteOutputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Максимальное сжатие
    });

    // Обработка ошибок
    archive.on('error', (err) => {
      throw err;
    });

    // Подключаем поток вывода
    archive.pipe(output);

    // Добавляем файлы в архив
    for (const file of files) {
      const absolutePath = path.resolve(userProjectDir, file);
      
      try {
        // Проверяем, существует ли файл
        await fs.access(absolutePath);
        
        // Читаем содержимое файла с учетом настроек комментариев
        const fileContent = await readFileContent(absolutePath, includeComments);
        
        // Определяем путь внутри архива
        let archivePath: string;
        if (useAbsolutePaths) {
          // Используем абсолютный путь, но убираем корневой слеш для ZIP
          archivePath = absolutePath.startsWith('/') ? absolutePath.slice(1) : absolutePath;
        } else {
          // Используем относительный путь от userProjectDir
          archivePath = path.relative(userProjectDir, absolutePath);
        }
        
        // Добавляем файл в архив
        archive.append(fileContent, { name: archivePath });
        
      } catch (error: any) {
        console.error(`Ошибка при обработке файла ${file}: ${error.message}`);
        // Продолжаем обработку других файлов
      }
    }

    // Завершаем создание архива
    await archive.finalize();

    // Ждем завершения записи
    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      output.on('error', reject);
    });

    console.log(`ZIP архив создан: ${absoluteOutputPath}`);
    return absoluteOutputPath;
  } catch (error) {
    console.error('Ошибка при создании ZIP архива:', error);
    throw error;
  }
}
