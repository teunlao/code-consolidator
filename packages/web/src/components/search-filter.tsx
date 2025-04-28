"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { FilterSettings } from '@/server/file-system';

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
            filterSettings
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

  // Обработчик клавиатурной навигации
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Навигация по стрелкам вверх/вниз
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedSuggestion(prev => {
          const next = prev + 1 >= suggestions.length ? 0 : prev + 1;
          scrollToSuggestion(next);
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedSuggestion(prev => {
          const next = prev - 1 < 0 ? suggestions.length - 1 : prev - 1;
          scrollToSuggestion(next);
          return next;
        });
      } else if (e.key === 'Enter' && focusedSuggestion >= 0) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[focusedSuggestion]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
  };

  // Функция для прокрутки списка к выбранному предложению
  const scrollToSuggestion = (index: number) => {
    if (suggestionsRef.current && suggestionsRef.current.children[index]) {
      suggestionsRef.current.children[index].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
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
  const formatSuggestion = (path: string) => {
    const segments = path.split('/');
    const lastSegment = segments.pop() || path;
    const parentPath = segments.length > 0 ? segments.join('/') : '';
    
    return (
      <div className="flex items-center w-full">
        <span className="font-medium">{lastSegment}</span>
        {parentPath && (
          <span className="text-gray-500 text-xs ml-2 truncate">
            ({parentPath})
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
          className="pl-9 pr-9 bg-gray-800 border-gray-700 text-gray-200 focus:ring-blue-500 focus:border-blue-500"
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
        
        {/* Иконка с подсказкой о функции автоматического раскрытия */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="absolute right-12 top-2.5 text-gray-400 hover:text-gray-200"
                onClick={(e) => e.preventDefault()}
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>При поиске папки будут автоматически раскрыты, если количество найденных файлов не превышает 10.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Выпадающий список предложений */}
        {showSuggestions && (
          <div 
            ref={suggestionsRef}
            className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-md bg-gray-800 border border-gray-700 shadow-lg py-1"
          >
            {isLoading ? (
              <div className="px-4 py-2 text-sm text-gray-400">Загрузка...</div>
            ) : suggestions.length > 0 ? (
              suggestions.map((suggestion, index) => (
                <div
                  key={suggestion}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className={cn(
                    "px-4 py-2 text-sm cursor-pointer hover:bg-gray-700",
                    focusedSuggestion === index ? "bg-gray-700" : ""
                  )}
                >
                  {formatSuggestion(suggestion)}
                </div>
              ))
            ) : (
              searchValue.length >= 2 && (
                <div className="px-4 py-2 text-sm text-gray-400">Нет результатов</div>
              )
            )}
          </div>
        )}
      </div>
      <Button 
        type="submit" 
        size="sm"
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        Найти
      </Button>
    </form>
  );
}