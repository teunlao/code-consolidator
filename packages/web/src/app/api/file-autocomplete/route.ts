import { NextRequest, NextResponse } from 'next/server';
import { generateFilePathSuggestions } from '@/server/file-autocomplete';
import { FilterSettings } from '@/server/file-system';

export async function GET(request: NextRequest) {
  // Получаем строку запроса из параметров URL
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');
  
  if (!query) {
    return NextResponse.json({ suggestions: [] });
  }
  
  try {
    // Получаем предложения для автодополнения без учета фильтров
    const suggestions = await generateFilePathSuggestions(query);
    
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error generating autocomplete suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' }, 
      { status: 500 }
    );
  }
}

// Добавляем POST метод для получения предложений с учетом фильтров
export async function POST(request: Request) {
  try {
    // Получаем данные из запроса
    const { query, filterSettings } = await request.json();
    
    if (!query) {
      return NextResponse.json({ suggestions: [] });
    }
    
    // Получаем предложения с учетом фильтров
    const suggestions = await generateFilePathSuggestions(query, filterSettings);
    
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error generating filtered autocomplete suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' }, 
      { status: 500 }
    );
  }
}