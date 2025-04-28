'use client';

import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EditableListProps {
  items: string[];
  onItemsChange: (items: string[]) => void;
  placeholder?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive';
  validateItem?: (item: string) => boolean;
  errorMessage?: string;
}

export function EditableList({
  items,
  onItemsChange,
  placeholder = 'Add item...',
  badgeVariant = 'default',
  validateItem,
  errorMessage = 'Invalid input',
}: EditableListProps) {
  const [newItem, setNewItem] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddItem = () => {
    if (!newItem.trim()) {
      return;
    }

    if (validateItem && !validateItem(newItem)) {
      setError(errorMessage);
      return;
    }

    setError(null);
    onItemsChange([...items, newItem.trim()]);
    setNewItem('');
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    onItemsChange(newItems);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    }
  };

  const getBadgeClass = () => {
    switch (badgeVariant) {
      case 'secondary':
        return 'bg-gray-700 text-gray-200 hover:bg-gray-600';
      case 'destructive':
        return 'bg-red-900/40 text-red-300 hover:bg-red-900/60';
      default:
        return 'bg-blue-900/40 text-blue-300 hover:bg-blue-900/60';
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mt-2 mb-3">
        {items.map((item, index) => (
          <div
            key={index}
            className={`inline-flex items-center rounded px-2 py-1 text-xs ${getBadgeClass()}`}
          >
            {item}
            <button
              type="button"
              onClick={() => handleRemoveItem(index)}
              className="ml-2 text-gray-400 hover:text-gray-200"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-sm text-gray-500 italic">Список пуст</div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={newItem}
          onChange={(e) => {
            setNewItem(e.target.value);
            if (error) {
              setError(null);
            }
          }}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          className="border-gray-700 bg-gray-700 text-gray-200 placeholder:text-gray-500"
        />
        <Button
          type="button"
          onClick={handleAddItem}
          disabled={!newItem.trim()}
          variant="outline"
          size="icon"
          className="bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
