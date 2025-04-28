import { FilterSettings, FileNode } from './types';
import { v4 as uuidv4 } from 'uuid';

// Типы для системы проектов и профилей
export interface ProjectSettings {
  includeComments: boolean;
  newPageForEachFile: boolean;
  outputFileName: string;
  filterSettings: FilterSettings;
  selectedFiles: string[]; // Пути к выбранным файлам
}

export interface Profile {
  id: string;
  name: string;
  description?: string;
  settings: ProjectSettings;
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  baseSettings: ProjectSettings;
  profiles: Profile[];
  createdAt: number;
  updatedAt: number;
}

// Корневой объект для хранения в localStorage
export interface ProjectsStorage {
  projects: Project[];
  activeProjectId?: string;
  activeProfileId?: string;
}

// Ключ для localStorage
const STORAGE_KEY = 'code-consolidator-projects';

// Дефолтные настройки проекта
export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  includeComments: true,
  newPageForEachFile: true,
  outputFileName: 'project_code.pdf',
  filterSettings: {
    ignoredDirectories: [],
    ignoredFiles: [],
    ignoredExtensions: [],
    allowedExtensions: [],
    useDefaultIgnores: true,
  },
  selectedFiles: [],
};

// Получение данных из localStorage
export function getProjectsStorage(): ProjectsStorage {
  if (typeof window === 'undefined') {
    return { projects: [] };
  }
  
  const storageData = localStorage.getItem(STORAGE_KEY);
  if (!storageData) {
    return { projects: [] };
  }
  
  try {
    return JSON.parse(storageData) as ProjectsStorage;
  } catch (error) {
    console.error('Ошибка при чтении данных проектов:', error);
    return { projects: [] };
  }
}

// Сохранение данных в localStorage
export function saveProjectsStorage(data: ProjectsStorage): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Создание нового проекта
export function createProject(name: string, description?: string): Project {
  return {
    id: uuidv4(),
    name,
    description,
    baseSettings: { ...DEFAULT_PROJECT_SETTINGS },
    profiles: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// Создание нового профиля внутри проекта
export function createProfile(
  projectId: string, 
  name: string, 
  description?: string, 
  inheritFromProject = true
): Profile {
  const storage = getProjectsStorage();
  const project = storage.projects.find(p => p.id === projectId);
  
  const settings = inheritFromProject && project 
    ? { ...project.baseSettings }
    : { ...DEFAULT_PROJECT_SETTINGS };
  
  return {
    id: uuidv4(),
    name,
    description,
    settings,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// Получение активного проекта
export function getActiveProject(): Project | undefined {
  const storage = getProjectsStorage();
  
  if (!storage.activeProjectId) {
    return undefined;
  }
  
  return storage.projects.find(p => p.id === storage.activeProjectId);
}

// Получение активного профиля
export function getActiveProfile(): Profile | undefined {
  const storage = getProjectsStorage();
  const project = getActiveProject();
  
  if (!project || !storage.activeProfileId) {
    return undefined;
  }
  
  return project.profiles.find(p => p.id === storage.activeProfileId);
}

// Получение текущих активных настроек (из профиля или проекта)
export function getActiveSettings(): ProjectSettings {
  const activeProfile = getActiveProfile();
  const activeProject = getActiveProject();
  
  if (activeProfile) {
    return activeProfile.settings;
  }
  
  if (activeProject) {
    return activeProject.baseSettings;
  }
  
  return DEFAULT_PROJECT_SETTINGS;
}

// Обновление выбранных файлов в активном контексте
export function updateSelectedFiles(selectedFiles: string[]): void {
  const storage = getProjectsStorage();
  const activeProject = storage.activeProjectId 
    ? storage.projects.find(p => p.id === storage.activeProjectId)
    : undefined;
    
  if (!activeProject) return;
  
  const activeProfile = storage.activeProfileId && activeProject
    ? activeProject.profiles.find(p => p.id === storage.activeProfileId)
    : undefined;
  
  if (activeProfile) {
    // Обновляем в активном профиле
    storage.projects = storage.projects.map(project => {
      if (project.id === storage.activeProjectId) {
        return {
          ...project,
          profiles: project.profiles.map(profile => {
            if (profile.id === storage.activeProfileId) {
              return {
                ...profile,
                settings: { ...profile.settings, selectedFiles },
                updatedAt: Date.now(),
              };
            }
            return profile;
          }),
        };
      }
      return project;
    });
  } else if (activeProject) {
    // Обновляем в базовых настройках проекта
    storage.projects = storage.projects.map(project => {
      if (project.id === storage.activeProjectId) {
        return {
          ...project,
          baseSettings: { ...project.baseSettings, selectedFiles },
          updatedAt: Date.now(),
        };
      }
      return project;
    });
  }
  
  saveProjectsStorage(storage);
}

// Вспомогательная функция для преобразования списка выбранных файлов в структуру дерева с выбранными элементами
export function applySelectedFilesToTree(fileTree: FileNode, selectedFiles: string[]): FileNode {
  const filesSet = new Set(selectedFiles);
  
  // Рекурсивно обходим дерево и проставляем selected: true для указанных файлов
  const updateSelection = (node: FileNode): FileNode => {
    const selected = filesSet.has(node.path);
    
    // Если это файл, просто обновляем выбор
    if (node.type === 'file') {
      return { ...node, selected };
    }
    
    // Если это директория, рекурсивно обрабатываем дочерние элементы
    if (node.children) {
      const updatedChildren = node.children.map(child => updateSelection(child));
      
      // Директория считается выбранной, если все ее дочерние элементы выбраны
      const allChildrenSelected = updatedChildren.length > 0 && 
        updatedChildren.every(child => child.selected);
      
      return {
        ...node,
        selected: allChildrenSelected,
        children: updatedChildren,
      };
    }
    
    return node;
  };
  
  return updateSelection(fileTree);
}

// Обновление настроек фильтрации в активном контексте
export function updateSettings(settings: Partial<ProjectSettings>): void {
  const storage = getProjectsStorage();
  const activeProject = storage.activeProjectId 
    ? storage.projects.find(p => p.id === storage.activeProjectId)
    : undefined;
    
  if (!activeProject) return;
  
  const activeProfile = storage.activeProfileId && activeProject
    ? activeProject.profiles.find(p => p.id === storage.activeProfileId)
    : undefined;
  
  if (activeProfile) {
    // Обновляем в активном профиле
    storage.projects = storage.projects.map(project => {
      if (project.id === storage.activeProjectId) {
        return {
          ...project,
          profiles: project.profiles.map(profile => {
            if (profile.id === storage.activeProfileId) {
              return {
                ...profile,
                settings: { ...profile.settings, ...settings },
                updatedAt: Date.now(),
              };
            }
            return profile;
          }),
        };
      }
      return project;
    });
  } else if (activeProject) {
    // Обновляем в базовых настройках проекта
    storage.projects = storage.projects.map(project => {
      if (project.id === storage.activeProjectId) {
        return {
          ...project,
          baseSettings: { ...project.baseSettings, ...settings },
          updatedAt: Date.now(),
        };
      }
      return project;
    });
  }
  
  saveProjectsStorage(storage);
}
