import { NextResponse } from 'next/server';
import { buildFileTree } from '@/server/file-system';
import path from 'path';

// Маршрут GET для получения дерева файлов без настроек фильтрации
export async function GET() {
  try {
    // Получаем каталог, откуда была запущена команда (проект пользователя)
    // Используем переменную окружения, которую установит start.js
    const projectDir = process.env.USER_PROJECT_DIR || process.cwd();
    
    // Строим дерево файлов без специальных настроек
    const fileTree = await buildFileTree(projectDir);
    
    return NextResponse.json({ fileTree });
  } catch (error) {
    console.error('Error getting file tree:', error);
    return NextResponse.json({ error: 'Failed to get file tree' }, { status: 500 });
  }
}

// Маршрут POST для получения дерева файлов с настройками фильтрации
export async function POST(request: Request) {
  try {
    // Получаем настройки фильтрации из запроса
    const { filterSettings } = await request.json();
    
    // Получаем каталог, откуда была запущена команда (проект пользователя)
    const projectDir = process.env.USER_PROJECT_DIR || process.cwd();
    
    // Строим дерево файлов с учетом настроек
    const fileTree = await buildFileTree(projectDir, filterSettings);
    
    return NextResponse.json({ fileTree });
  } catch (error) {
    console.error('Error getting file tree:', error);
    return NextResponse.json({ error: 'Failed to get file tree' }, { status: 500 });
  }
}