import { NextResponse } from 'next/server';
import { buildFileTree } from '@/server/file-system';
import path from 'path';

export async function GET() {
  try {
    // Получаем текущий рабочий каталог (проект пользователя)
    const projectDir = process.cwd();
    
    // Строим дерево файлов
    const fileTree = await buildFileTree(projectDir);
    
    return NextResponse.json({ fileTree });
  } catch (error) {
    console.error('Error getting file tree:', error);
    return NextResponse.json({ error: 'Failed to get file tree' }, { status: 500 });
  }
}