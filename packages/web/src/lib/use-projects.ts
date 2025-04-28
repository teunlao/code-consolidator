import { useEffect, useState } from 'react';
import { 
  Project, 
  Profile, 
  ProjectSettings,
  getProjectsStorage, 
  saveProjectsStorage,
  createProject as createProjectUtil,
  createProfile as createProfileUtil,
  DEFAULT_PROJECT_SETTINGS
} from './projects-storage';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>();
  const [activeProfileId, setActiveProfileId] = useState<string | undefined>();
  const [isLoaded, setIsLoaded] = useState(false);

  // Загрузка данных из localStorage при инициализации
  useEffect(() => {
    const storage = getProjectsStorage();
    setProjects(storage.projects);
    setActiveProjectId(storage.activeProjectId);
    setActiveProfileId(storage.activeProfileId);
    setIsLoaded(true);
  }, []);

  // Сохранение изменений в localStorage
  useEffect(() => {
    if (!isLoaded) return;
    
    const storage = getProjectsStorage();
    storage.projects = projects;
    storage.activeProjectId = activeProjectId;
    storage.activeProfileId = activeProfileId;
    saveProjectsStorage(storage);
  }, [projects, activeProjectId, activeProfileId, isLoaded]);

  // Активный проект
  const activeProject = activeProjectId 
    ? projects.find(p => p.id === activeProjectId) 
    : undefined;

  // Активный профиль
  const activeProfile = activeProject && activeProfileId
    ? activeProject.profiles.find(p => p.id === activeProfileId)
    : undefined;

  // Активные настройки (из профиля или из проекта)
  const activeSettings = activeProfile 
    ? activeProfile.settings 
    : activeProject 
      ? activeProject.baseSettings 
      : DEFAULT_PROJECT_SETTINGS;

  // Создание нового проекта
  const createProject = (name: string, description?: string) => {
    const newProject = createProjectUtil(name, description);
    setProjects([...projects, newProject]);
    return newProject;
  };

  // Обновление проекта
  const updateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects(projects.map(project => 
      project.id === projectId 
        ? { ...project, ...updates, updatedAt: Date.now() } 
        : project
    ));
  };

  // Удаление проекта
  const deleteProject = (projectId: string) => {
    setProjects(projects.filter(project => project.id !== projectId));
    
    // Если удаляем активный проект, сбрасываем активные проект и профиль
    if (activeProjectId === projectId) {
      setActiveProjectId(undefined);
      setActiveProfileId(undefined);
    }
  };

  // Создание нового профиля в проекте
  const createProfile = (
    projectId: string, 
    name: string, 
    description?: string, 
    inheritFromProject = true
  ) => {
    const newProfile = createProfileUtil(projectId, name, description, inheritFromProject);
    
    setProjects(projects.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          profiles: [...project.profiles, newProfile],
          updatedAt: Date.now()
        };
      }
      return project;
    }));
    
    return newProfile;
  };

  // Обновление профиля
  const updateProfile = (projectId: string, profileId: string, updates: Partial<Profile>) => {
    setProjects(projects.map(project => {
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
    }));
  };

  // Удаление профиля
  const deleteProfile = (projectId: string, profileId: string) => {
    setProjects(projects.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          profiles: project.profiles.filter(profile => profile.id !== profileId),
          updatedAt: Date.now()
        };
      }
      return project;
    }));
    
    // Если удаляем активный профиль, сбрасываем его
    if (activeProfileId === profileId) {
      setActiveProfileId(undefined);
    }
  };

  // Установка активного проекта
  const setActiveProject = (projectId?: string) => {
    setActiveProjectId(projectId);
    setActiveProfileId(undefined); // При смене проекта сбрасываем активный профиль
  };

  // Установка активного профиля
  const setActiveProfile = (profileId?: string) => {
    setActiveProfileId(profileId);
  };

  // Обновление настроек активного проекта или профиля
  const updateActiveSettings = (updates: Partial<ProjectSettings>) => {
    if (activeProfile && activeProjectId) {
      // Обновляем настройки в активном профиле
      updateProfile(activeProjectId, activeProfile.id, {
        settings: { ...activeProfile.settings, ...updates }
      });
    } else if (activeProject) {
      // Обновляем базовые настройки проекта
      updateProject(activeProject.id, {
        baseSettings: { ...activeProject.baseSettings, ...updates }
      });
    }
  };

  return {
    projects,
    activeProjectId,
    activeProfileId,
    activeProject,
    activeProfile,
    activeSettings,
    createProject,
    updateProject,
    deleteProject,
    createProfile,
    updateProfile,
    deleteProfile,
    setActiveProject,
    setActiveProfile,
    updateActiveSettings,
    isLoaded
  };
}
