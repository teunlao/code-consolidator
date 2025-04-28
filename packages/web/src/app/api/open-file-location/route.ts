import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// Функция для открытия файла в системном файловом менеджере
export async function POST(request: Request) {
  try {
    const { filePath } = await request.json();
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'Не указан путь к файлу' }, 
        { status: 400 }
      );
    }
    
    // Проверяем существование файла
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Файл не найден' }, 
        { status: 404 }
      );
    }
    
    const platform = os.platform();
    const dirPath = path.dirname(filePath);
    
    let command;
    
    // Выбор команды в зависимости от операционной системы
    if (platform === 'darwin') {
      // macOS - открыть Finder
      command = `open "${dirPath}"`;
    } else if (platform === 'win32') {
      // Windows - открыть Explorer
      command = `explorer "${dirPath.replace(/\//g, '\\')}"`;
    } else {
      // Linux и другие Unix-подобные системы
      command = `xdg-open "${dirPath}"`;
    }
    
    // Выполняем команду
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