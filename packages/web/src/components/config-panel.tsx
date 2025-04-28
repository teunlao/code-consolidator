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
    <div className="border border-gray-700 rounded-md p-4 space-y-4 bg-gray-800">
      <h2 className="text-lg font-semibold text-gray-100">Настройки генерации</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="include-comments" className="text-gray-200">Включить комментарии</Label>
          <Switch 
            id="include-comments" 
            checked={includeComments} 
            onCheckedChange={onIncludeCommentsChange}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="new-page" className="text-gray-200">Новая страница для каждого файла</Label>
          <Switch 
            id="new-page" 
            checked={newPageForEachFile} 
            onCheckedChange={onNewPageForEachFileChange}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="output-file" className="text-gray-200">Имя выходного файла</Label>
          <Input 
            id="output-file" 
            value={outputFileName} 
            onChange={(e) => onOutputFileNameChange(e.target.value)} 
            placeholder="project_code.pdf"
            className="bg-gray-700 border-gray-600 text-gray-200 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      <div className="pt-2">
        <Button 
          onClick={onGenerate}
          disabled={selectedFilesCount === 0}
          className={cn(
            "w-full", 
            selectedFilesCount === 0 
              ? "bg-gray-600 cursor-not-allowed opacity-70" 
              : "bg-blue-600 hover:bg-blue-700 text-white"
          )}
        >
          Сгенерировать PDF{selectedFilesCount > 0 ? ` (${selectedFilesCount} файлов)` : ''}
        </Button>
      </div>
    </div>
  );
}