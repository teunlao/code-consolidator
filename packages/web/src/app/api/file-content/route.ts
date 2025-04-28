import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(request: Request) {
  try {
    const { filePath } = await request.json();
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'Путь к файлу не указан' }, 
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
    
    // Проверяем, что это действительно файл, а не директория
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return NextResponse.json(
        { error: 'Указанный путь не является файлом' }, 
        { status: 400 }
      );
    }
    
    // Проверяем размер файла - не слишком ли большой
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (stats.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Файл слишком большой для отображения (более 5MB)' }, 
        { status: 413 }
      );
    }
    
    // Читаем содержимое файла
    let content = fs.readFileSync(filePath, 'utf-8');
    
    return NextResponse.json({ content });
  } catch (error: any) {
    console.error('Error reading file:', error);
    return NextResponse.json(
      { error: `Ошибка чтения файла: ${error.message}` }, 
      { status: 500 }
    );
  }
}