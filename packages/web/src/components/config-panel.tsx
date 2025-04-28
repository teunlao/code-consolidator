"use client"

import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ConfigPanelProps {
  includeComments: boolean;
  onIncludeCommentsChange: (value: boolean) => void;
  newPageForEachFile: boolean;
  onNewPageForEachFileChange: (value: boolean) => void;
  outputFileName: string;
  onOutputFileNameChange: (value: string) => void;
  onGenerate: () => void;
  selectedFilesCount: number;
}

export function ConfigPanel({
  includeComments,
  onIncludeCommentsChange,
  newPageForEachFile,
  onNewPageForEachFileChange,
  outputFileName,
  onOutputFileNameChange,
  onGenerate,
  selectedFilesCount
}: ConfigPanelProps) {
  return (
    <div className="border rounded-md p-4 space-y-4">
      <h2 className="text-lg font-semibold">Настройки генерации</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="include-comments">Включить комментарии</Label>
          <Switch 
            id="include-comments" 
            checked={includeComments} 
            onCheckedChange={onIncludeCommentsChange} 
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="new-page">Новая страница для каждого файла</Label>
          <Switch 
            id="new-page" 
            checked={newPageForEachFile} 
            onCheckedChange={onNewPageForEachFileChange} 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="output-file">Имя выходного файла</Label>
          <Input 
            id="output-file" 
            value={outputFileName} 
            onChange={(e) => onOutputFileNameChange(e.target.value)} 
            placeholder="project_code.pdf"
          />
        </div>
      </div>
      
      <div className="pt-2">
        <Button 
          onClick={onGenerate}
          disabled={selectedFilesCount === 0}
          className="w-full"
        >
          Сгенерировать PDF{selectedFilesCount > 0 ? ` (${selectedFilesCount} файлов)` : ''}
        </Button>
      </div>
    </div>
  );
}