'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Info, Search, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

import type { FilterSettings } from '@/server/file-system';

interface SearchFilterProps {
  onSearch: (pattern: string) => void;
  filterSettings?: FilterSettings; // Добавляем настройки фильтрации
}

export function SearchFilter({ onSearch, filterSettings }: SearchFilterProps) {
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedSuggestion, setFocusedSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Функция для получения предложений автокомплита
  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      setIsLoading(true);

      // Если есть настройки фильтрации, используем POST запрос
      if (filterSettings) {
        const response = await fetch('/api/file-autocomplete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            filterSettings,
          }),
        });

        const data = await response.json();

        if (data.suggestions) {
          setSuggestions(data.suggestions);
        }
      } else {
        // Иначе используем GET запрос без фильтрации
        const response = await fetch(`/api/file-autocomplete?query=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.suggestions) {
          setSuggestions(data.suggestions);
        }
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчик изменения текста в поле поиска
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);

    // Сбросить фокусированное предложение при изменении ввода
    setFocusedSuggestion(-1);

    // Показать список предложений
    if (value.length >= 2) {
      setShowSuggestions(true);
      fetchSuggestions(value);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  // Обработчик выбора предложения
  const handleSelectSuggestion = (suggestion: string) => {
    // Получаем имя файла или папки из полного пути
    const fileName = suggestion.split('/').pop() || suggestion;
    setSearchValue(fileName);
    setShowSuggestions(false);
    onSearch(fileName);
  };

  // Обработчик клавиатурной навигации - оптимизированная версия
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Навигация по стрелкам вверх/вниз
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        // Перемещение вниз по списку
        setFocusedSuggestion(prev => {
          const next = prev + 1 >= suggestions.length ? 0 : prev + 1;
          // Устанавливаем таймаут для скролла, чтобы дать React время для обновления состояния
          setTimeout(() => scrollToSuggestion(next), 0);
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        // Перемещение вверх по списку
        setFocusedSuggestion(prev => {
          const next = prev - 1 < 0 ? suggestions.length - 1 : prev - 1;
          setTimeout(() => scrollToSuggestion(next), 0);
          return next;
        });
      } else if (e.key === 'Enter' && focusedSuggestion >= 0) {
        e.preventDefault();
        // Выбор текущего предложения
        handleSelectSuggestion(suggestions[focusedSuggestion]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
      }
    }
  };

  // Функция для прокрутки списка к выбранному предложению
  const scrollToSuggestion = (index: number) => {
    if (suggestionsRef.current && suggestionsRef.current.children[index]) {
      const element = suggestionsRef.current.children[index];
      const container = suggestionsRef.current;
      
      // Проверяем, нужна ли прокрутка
      const elementTop = element.offsetTop;
      const elementBottom = elementTop + element.clientHeight;
      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.clientHeight;
      
      // Если элемент выше видимой области, прокручиваем вверх
      if (elementTop < containerTop) {
        container.scrollTop = elementTop;
      }
      // Если элемент ниже видимой области, прокручиваем вниз
      else if (elementBottom > containerBottom) {
        container.scrollTop = elementBottom - container.clientHeight;
      }
    }
  };

  // Обработчик клика вне компонента
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Обработчик отправки формы
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    onSearch(searchValue);
  };

  // Обработчик очистки поля
  const handleClear = () => {
    setSearchValue('');
    setShowSuggestions(false);
    setSuggestions([]);
    onSearch('');
    inputRef.current?.focus();
  };

  // Отображение последнего сегмента пути (имя файла или папки)
  const formatSuggestion = (path: string, index: number) => {
    const segments = path.split('/');
    const lastSegment = segments.pop() || path;
    const parentPath = segments.length > 0 ? segments.join('/') : '';
    const isSelected = index === focusedSuggestion;

    return (
      <div className="flex flex-col w-full">
        <span className="font-medium">{lastSegment}</span>
        {parentPath && (
          <span 
            className={`text-xs truncate ${
              isSelected ? 'text-blue-100' : 'text-gray-500'
            }`}
            style={{ 
              opacity: isSelected ? 0.9 : 0.7 
            }}
          >
            {parentPath}
          </span>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Поиск файлов..."
          value={searchValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchValue.length >= 2) {
              setShowSuggestions(true);
              fetchSuggestions(searchValue);
            }
          }}
          className="pl-9 pr-9 border-gray-700 text-gray-200 focus:ring-blue-500 focus:border-blue-500"
          style={{ backgroundColor: '#1f2937' }}
        />
        {searchValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Иконка информации удалена */}

        {/* Выпадающий список предложений */}
        {showSuggestions && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border border-gray-700 shadow-lg py-1 autocomplete-dropdown"
            style={{
              backgroundColor: '#1e2030',
            }}
          >
            {isLoading ? (
              <div className="px-4 py-2 text-sm text-gray-400">Загрузка...</div>
            ) : suggestions.length > 0 ? (
              suggestions.map((suggestion, index) => (
                // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
                <div
                  key={suggestion}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  style={{
                    backgroundColor: focusedSuggestion === index ? '#2563eb' : '#1e2030',
                    position: 'relative',
                  }}
                  className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-800 ${
                    focusedSuggestion === index ? 'text-white' : 'text-gray-200'
                  }`}
                >
                  {formatSuggestion(suggestion, index)}
                </div>
              ))
            ) : (
              searchValue.length >= 2 && <div className="px-4 py-2 text-sm text-gray-400">Нет результатов</div>
            )}
          </div>
        )}
      </div>
      <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
        Найти
      </Button>
    </form>
  );
}
