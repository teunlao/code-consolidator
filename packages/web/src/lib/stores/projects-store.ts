import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { FilterSettings, FileNode } from '@/lib/types';

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

// Состояние для zustand
interface ProjectState {
  projects: Project[];
  activeProjectId?: string;
  activeProfileId?: string;
  
  // Геттеры для удобного доступа к активным объектам
  getActiveProject: () => Project | undefined;
  getActiveProfile: () => Profile | undefined;
  getActiveSettings: () => ProjectSettings;
  
  // Методы для изменения состояния
  createProject: (name: string, description?: string) => Project;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  
  createProfile: (projectId: string, name: string, description?: string, inheritFromProject?: boolean) => Profile;
  updateProfile: (projectId: string, profileId: string, updates: Partial<Profile>) => void;
  deleteProfile: (projectId: string, profileId: string) => void;
  
  setActiveProject: (projectId?: string) => void;
  setActiveProfile: (profileId?: string) => void;
  
  updateActiveSettings: (updates: Partial<ProjectSettings>) => void;
  
  // Вспомогательные утилиты
  applySelectedFilesToTree: (fileTree: FileNode, selectedFiles: string[]) => FileNode;
}

// Создаем хранилище с Zustand
export const useProjectsStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: undefined,
      activeProfileId: undefined,
      
      // Геттеры
      getActiveProject: () => {
        const { projects, activeProjectId } = get();
        return projects.find(p => p.id === activeProjectId);
      },
      
      getActiveProfile: () => {
        const { activeProfileId } = get();
        const activeProject = get().getActiveProject();
        
        if (!activeProject || !activeProfileId) {
          return undefined;
        }
        
        return activeProject.profiles.find(p => p.id === activeProfileId);
      },
      
      getActiveSettings: () => {
        const activeProfile = get().getActiveProfile();
        const activeProject = get().getActiveProject();
        
        if (activeProfile) {
          return activeProfile.settings;
        }
        
        if (activeProject) {
          return activeProject.baseSettings;
        }
        
        return DEFAULT_PROJECT_SETTINGS;
      },
      
      // Методы для проектов
      createProject: (name, description) => {
        const newProject: Project = {
          id: uuidv4(),
          name,
          description,
          baseSettings: { ...DEFAULT_PROJECT_SETTINGS },
          profiles: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        
        set((state) => ({ 
          projects: [...state.projects, newProject],
          activeProjectId: newProject.id,
          activeProfileId: undefined
        }));
        
        return newProject;
      },
      
      updateProject: (projectId, updates) => {
        set((state) => ({
          projects: state.projects.map(project => 
            project.id === projectId
              ? { ...project, ...updates, updatedAt: Date.now() }
              : project
          )
        }));
      },
      
      deleteProject: (projectId) => {
        set((state) => {
          // Если удаляем активный проект, сбрасываем активные выборы
          const updatedState: Partial<ProjectState> = {
            projects: state.projects.filter(project => project.id !== projectId)
          };
          
          if (state.activeProjectId === projectId) {
            updatedState.activeProjectId = undefined;
            updatedState.activeProfileId = undefined;
          }
          
          return updatedState as ProjectState;
        });
      },
      
      // Методы для профилей
      createProfile: (projectId, name, description, inheritFromProject = true) => {
        const { projects } = get();
        const project = projects.find(p => p.id === projectId);
        
        const settings = inheritFromProject && project 
          ? { ...project.baseSettings }
          : { ...DEFAULT_PROJECT_SETTINGS };
        
        const newProfile: Profile = {
          id: uuidv4(),
          name,
          description,
          settings,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        
        set((state) => ({
          projects: state.projects.map(project => {
            if (project.id === projectId) {
              return {
                ...project,
                profiles: [...project.profiles, newProfile],
                updatedAt: Date.now()
              };
            }
            return project;
          }),
          activeProfileId: newProfile.id
        }));
        
        return newProfile;
      },
      
      updateProfile: (projectId, profileId, updates) => {
        set((state) => ({
          projects: state.projects.map(project => {
            if (project.id === projectId) {
              return {
                ...project,
                profiles: project.profiles.map(profile => 
                  profile.id === profileId
                    ? { ...profile, ...updates, updatedAt: Date.now() }
                    : profile
                ),
                updatedAt: Date.now()
              };
            }
            return project;
          })
        }));
      },
      
      deleteProfile: (projectId, profileId) => {
        set((state) => {
          const updatedState: Partial<ProjectState> = {
            projects: state.projects.map(project => {
              if (project.id === projectId) {
                return {
                  ...project,
                  profiles: project.profiles.filter(profile => profile.id !== profileId),
                  updatedAt: Date.now()
                };
              }
              return project;
            })
          };
          
          // Если удаляем активный профиль, сбрасываем его
          if (state.activeProfileId === profileId) {
            updatedState.activeProfileId = undefined;
          }
          
          return updatedState as ProjectState;
        });
      },
      
      // Управление активными выборами
      setActiveProject: (projectId) => {
        set({ 
          activeProjectId: projectId,
          activeProfileId: undefined // При смене проекта сбрасываем профиль
        });
      },
      
      setActiveProfile: (profileId) => {
        set({ activeProfileId: profileId });
      },
      
      // Обновление настроек
      updateActiveSettings: (updates) => {
        const { activeProjectId, activeProfileId } = get();
        const activeProfile = get().getActiveProfile();
        const activeProject = get().getActiveProject();
        
        if (activeProfile && activeProjectId) {
          // Обновляем настройки в активном профиле
          get().updateProfile(activeProjectId, activeProfile.id, {
            settings: { ...activeProfile.settings, ...updates }
          });
        } else if (activeProject) {
          // Обновляем базовые настройки проекта
          get().updateProject(activeProject.id, {
            baseSettings: { ...activeProject.baseSettings, ...updates }
          });
        }
      },
      
      // Применение выбранных файлов к дереву
      applySelectedFilesToTree: (fileTree, selectedFiles) => {
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
    }),
    {
      name: 'code-consolidator-projects',
      // Версионирование хранилища для возможных будущих изменений структуры данных
      version: 1
    }
  )
);
