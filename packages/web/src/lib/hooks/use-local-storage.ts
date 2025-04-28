'use client';

import { useState, useEffect } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Получаем сохраненное значение из localStorage (или используем initialValue)
  const readValue = (): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Ошибка чтения из localStorage для ключа "${key}":`, error);
      return initialValue;
    }
  };

  // Состояние для хранения текущего значения
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Функция для обновления состояния и localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Разрешаем передавать функцию, как в обычном useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Сохраняем в состоянии React
      setStoredValue(valueToStore);
      
      // Сохраняем в localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Ошибка записи в localStorage для ключа "${key}":`, error);
    }
  };

  useEffect(() => {
    // Синхронизируем состояние, если значение в localStorage было изменено извне
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        setStoredValue(JSON.parse(event.newValue));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue];
}