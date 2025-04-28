"use client"

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Info } from 'lucide-react';
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SearchFilterProps {
  onSearch: (pattern: string) => void;
}

export function SearchFilter({ onSearch }: SearchFilterProps) {
  const [searchValue, setSearchValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchValue);
  };

  const handleClear = () => {
    setSearchValue('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Поиск файлов..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
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