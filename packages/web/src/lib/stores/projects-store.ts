import type { FileNode, FilterSettings } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Типы для системы проектов и профилей
export interface ProjectSettings {
  includeComments: boolean;
  newPageForEachFile: boolean;
  outputFileName: string;
  useAbsolutePaths: boolean; // Новое свойство для использования абсолютных путей
  outputFormat: 'pdf' | 'markdown' | 'zip'; // Новое поле для выбора формата
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
  outputFileName: 'project_code.md',
  useAbsolutePaths: true, // Абсолютные пути включены по умолчанию
  outputFormat: 'markdown', // Значение по умолчанию для формата
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

  // Новый метод для копирования профиля
  copyProfile: (projectId: string, profileId: string, newName?: string) => Profile;

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
        return projects.find((p) => p.id === activeProjectId);
      },

      getActiveProfile: () => {
        const { activeProfileId } = get();
        const activeProject = get().getActiveProject();

        if (!activeProject || !activeProfileId) {
          return undefined;
        }

        return activeProject.profiles.find((p) => p.id === activeProfileId);
      },

      // Простое получение настроек с приоритетом настроек профиля
      getActiveSettings: () => {
        const activeProfile = get().getActiveProfile();
        const activeProject = get().getActiveProject();

        if (activeProfile && activeProject) {
          // Просто объединяем настройки. Настройки профиля имеют приоритет.
          return {
            ...activeProject.baseSettings,
            ...activeProfile.settings,
          };
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
          activeProfileId: undefined,
        }));

        return newProject;
      },

      updateProject: (projectId, updates) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId ? { ...project, ...updates, updatedAt: Date.now() } : project,
          ),
        }));
      },

      deleteProject: (projectId) => {
        set((state) => {
          // Если удаляем активный проект, сбрасываем активные выборы
          const updatedState: Partial<ProjectState> = {
            projects: state.projects.filter((project) => project.id !== projectId),
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
        const project = projects.find((p) => p.id === projectId);

        // При создании профиля с наследованием, устанавливаем только базовые настройки
        // Теперь профиль наследует изменения в базовых настройках автоматически
        const settings = inheritFromProject && project ? { ...project.baseSettings } : { ...DEFAULT_PROJECT_SETTINGS };

        // Создаем новый профиль
        const newProfile: Profile = {
          id: uuidv4(),
          name,
          description,
          settings,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id === projectId) {
              return {
                ...project,
                profiles: [...project.profiles, newProfile],
                updatedAt: Date.now(),
              };
            }
            return project;
          }),
          activeProfileId: newProfile.id,
        }));

        return newProfile;
      },

      updateProfile: (projectId, profileId, updates) => {
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id === projectId) {
              return {
                ...project,
                profiles: project.profiles.map((profile) =>
                  profile.id === profileId ? { ...profile, ...updates, updatedAt: Date.now() } : profile,
                ),
                updatedAt: Date.now(),
              };
            }
            return project;
          }),
        }));
      },

      deleteProfile: (projectId, profileId) => {
        set((state) => {
          const updatedState: Partial<ProjectState> = {
            projects: state.projects.map((project) => {
              if (project.id === projectId) {
                return {
                  ...project,
                  profiles: project.profiles.filter((profile) => profile.id !== profileId),
                  updatedAt: Date.now(),
                };
              }
              return project;
            }),
          };

          // Если удаляем активный профиль, сбрасываем его
          if (state.activeProfileId === profileId) {
            updatedState.activeProfileId = undefined;
          }

          return updatedState as ProjectState;
        });
      },

      // Метод для копирования профиля
      copyProfile: (projectId, profileId) => {
        const { projects } = get();
        const project = projects.find((p) => p.id === projectId);

        if (!project) {
          throw new Error('Проект не найден');
        }

        const sourceProfile = project.profiles.find((p) => p.id === profileId);

        if (!sourceProfile) {
          throw new Error('Профиль не найден');
        }

        // Создаем копию профиля с новым ID
        const copyName = `${sourceProfile.name} (копия)`;

        const newProfile: Profile = {
          id: uuidv4(),
          name: copyName,
          description: sourceProfile.description,
          settings: { ...sourceProfile.settings },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === projectId) {
              return {
                ...p,
                profiles: [...p.profiles, newProfile],
                updatedAt: Date.now(),
              };
            }
            return p;
          }),
          activeProfileId: newProfile.id, // Сразу активируем скопированный профиль
        }));

        return newProfile;
      },

      // Управление активными выборами
      setActiveProject: (projectId) => {
        set({
          activeProjectId: projectId,
          activeProfileId: undefined, // При смене проекта сбрасываем профиль
        });
      },

      setActiveProfile: (profileId) => {
        set({ activeProfileId: profileId });
      },

      // Обновление настроек
      updateActiveSettings: (updates) => {
        const { activeProjectId } = get();
        const activeProfile = get().getActiveProfile();
        const activeProject = get().getActiveProject();

        if (activeProfile && activeProjectId) {
          // Просто обновляем настройки без логики overrides
          get().updateProfile(activeProjectId, activeProfile.id, {
            settings: { ...activeProfile.settings, ...updates },
          });
        } else if (activeProject) {
          // Обновляем базовые настройки проекта
          get().updateProject(activeProject.id, {
            baseSettings: { ...activeProject.baseSettings, ...updates },
          });
        }
      },

      // Применение выбранных файлов к дереву
      applySelectedFilesToTree: (fileTree, selectedFiles) => {
        // Создаем новый Set для быстрого поиска
        const filesSet = new Set(selectedFiles);

        // Сначала выполняем глубокое клонирование дерева, чтобы избежать мутаций
        const clonedTree = structuredClone(fileTree) as FileNode;

        // Рекурсивно обходим дерево и проставляем selected: true для указанных файлов
        const updateSelection = (node: FileNode): FileNode => {
          // Для файлов - просто проверяем наличие пути в списке выбранных
          if (node.type === 'file') {
            return {
              ...node,
              selected: filesSet.has(node.path),
            };
          }

          // Для директорий - обрабатываем дочерние элементы
          if (node.children) {
            // Сначала обновляем всех детей
            const updatedChildren = node.children.map((child) => updateSelection(child));

            // Директория считается выбранной, если все её дочерние элементы выбраны
            const allChildrenSelected = updatedChildren.length > 0 && updatedChildren.every((child) => child.selected);

            return {
              ...node,
              selected: allChildrenSelected,
              children: updatedChildren,
            };
          }

          return { ...node, selected: false };
        };

        // Применяем обновление выбора к клонированному дереву
        return updateSelection(clonedTree);
      },
    }),
    {
      name: 'code-consolidator-projects',
      // Версионирование хранилища для возможных будущих изменений структуры данных
      version: 1,
    },
  ),
);
