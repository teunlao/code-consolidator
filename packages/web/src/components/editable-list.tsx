"use client"

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';

interface EditableListProps {
  items: string[];
  onItemsChange: (items: string[]) => void;
  placeholder?: string;
  validateItem?: (item: string) => boolean;
  errorMessage?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}

export function EditableList({
  items,
  onItemsChange,
  placeholder = "Добавить новый элемент...",
  validateItem = () => true,
  errorMessage = "Неверный формат",
  badgeVariant = "default"
}: EditableListProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const handleAddItem = () => {
    const value = inputValue.trim();
    if (!value) return;

    if (!validateItem(value)) {
      setError(errorMessage);
      return;
    }

    // Проверка на дубликаты
    if (items.includes(value)) {
      setError('Этот элемент уже добавлен');
      return;
    }

    onItemsChange([...items, value]);
    setInputValue('');
    setError('');
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    onItemsChange(newItems);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setError('');
          }}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={handleAddItem}
          size="sm"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
      
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {items.map((item, index) => (
            <Badge 
              key={index} 
              variant={badgeVariant}
              className="flex items-center gap-1 px-2 py-1"
            >
              <span>{item}</span>
              <button 
                type="button" 
                onClick={() => handleRemoveItem(index)}
                className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
