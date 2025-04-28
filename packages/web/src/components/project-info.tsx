'use client';

import React from 'react';
import { useProjects } from '@/lib/use-projects';
import { formatDate } from '@/lib/format-utils';
import { Badge } from '@/components/ui/badge';
import { Layers, Clock, FilePlus } from 'lucide-react';

export function ProjectInfo() {
  const { activeProject, activeProfile } = useProjects();
  
  if (!activeProject) {
    return null;
  }
  
  return (
    <div className="border border-gray-700 rounded-md p-3 bg-gray-800 mb-4 text-sm text-gray-300">
      <div className="flex items-center gap-2 mb-2">
        <Layers className="h-4 w-4 text-blue-400" />
        <span className="font-medium text-gray-200">{activeProject.name}</span>
        
        <Badge variant="outline" className="ml-auto text-xs bg-gray-700 text-gray-300 border-gray-600">
          <Clock className="h-3 w-3 mr-1" />
          {formatDate(activeProject.updatedAt)}
        </Badge>
      </div>
      
      {activeProject.description && (
        <p className="mb-2 text-gray-400 text-xs">{activeProject.description}</p>
      )}
      
      {activeProfile && (
        <div className="border-t border-gray-700 mt-2 pt-2">
          <div className="flex items-center gap-2 mb-1">
            <FilePlus className="h-4 w-4 text-green-400" />
            <span className="font-medium text-gray-200">{activeProfile.name}</span>
            
            <Badge variant="outline" className="ml-auto text-xs bg-gray-700 text-gray-300 border-gray-600">
              <Clock className="h-3 w-3 mr-1" />
              {formatDate(activeProfile.updatedAt)}
            </Badge>
          </div>
          
          {activeProfile.description && (
            <p className="text-gray-400 text-xs">{activeProfile.description}</p>
          )}
        </div>
      )}
      
      <div className="border-t border-gray-700 mt-2 pt-2 text-xs">
        <div className="flex gap-4">
          <div>
            <span className="text-gray-400">Комментарии:</span>{' '}
            <span className="text-gray-200">{
              activeProfile ? 
                (activeProfile.settings.includeComments ? 'Включены' : 'Исключены') : 
                (activeProject.baseSettings.includeComments ? 'Включены' : 'Исключены')
            }</span>
          </div>
          
          <div>
            <span className="text-gray-400">Новая страница для файла:</span>{' '}
            <span className="text-gray-200">{
              activeProfile ? 
                (activeProfile.settings.newPageForEachFile ? 'Да' : 'Нет') : 
                (activeProject.baseSettings.newPageForEachFile ? 'Да' : 'Нет')
            }</span>
          </div>
          
          <div>
            <span className="text-gray-400">Файл:</span>{' '}
            <span className="text-gray-200 font-mono">{
              activeProfile ? 
                activeProfile.settings.outputFileName : 
                activeProject.baseSettings.outputFileName
            }</span>
          </div>
        </div>
      </div>
    </div>
  );
}
