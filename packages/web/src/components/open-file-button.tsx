'use client';

import { Button } from './ui/button';
import { ExternalLink, FolderOpen } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OpenFileButtonProps {
  filePath: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showTooltip?: boolean;
  tooltipText?: string;
}

export function OpenFileButton({
  filePath,
  variant = 'outline',
  size = 'icon',
  className,
  showTooltip = true,
  tooltipText = 'Открыть местоположение файла'
}: OpenFileButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenFile = async () => {
    if (!filePath || isLoading) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/open-file-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        console.error('Ошибка при открытии файла:', data.error);
      }
    } catch (error) {
      console.error('Ошибка при вызове API:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const button = (
    <Button
      variant={variant}
      size={size}
      onClick={handleOpenFile}
      disabled={isLoading}
      className={cn(
        className,
        "transition-colors duration-200",
        variant === "ghost" && "hover:bg-gray-800/50"
      )}
      type="button"
    >
      {isLoading ? <ExternalLink className="h-4 w-4 animate-pulse" /> : <FolderOpen className="h-4 w-4" />}
    </Button>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
