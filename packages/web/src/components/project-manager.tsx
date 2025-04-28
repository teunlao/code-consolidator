'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Check, ChevronDown, FilePlus, FolderPlus, Pencil, Trash2, Layers } from 'lucide-react';
import { useProjectsStore, Project, Profile } from '@/lib/stores/projects-store';

// Компонент для отображения выбранного проекта и профиля
export function ProjectSelector() {
  const { 
    projects, 
    activeProjectId,
    activeProfileId,
    getActiveProject,
    getActiveProfile,
    setActiveProject, 
    setActiveProfile,
    createProject: storeCreateProject,
    createProfile: storeCreateProfile,
    updateProject,
    updateProfile,
    deleteProject,
    deleteProfile
  } = useProjectsStore();
  
  const activeProject = getActiveProject();
  const activeProfile = getActiveProfile();
  
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showNewProfileDialog, setShowNewProfileDialog] = useState(false);
  const [showEditProjectDialog, setShowEditProjectDialog] = useState(false);
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  
  if (projects.length === 0) {
    return (
      <div className="flex items-center gap-2 border border-gray-700 rounded-md p-3 bg-gray-800 mb-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowNewProjectDialog(true)}
          className="bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200"
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          Создать первый проект
        </Button>
        
        <NewProjectDialog 
          isOpen={showNewProjectDialog} 
          onClose={() => setShowNewProjectDialog(false)} 
          createProject={storeCreateProject}
        />
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2 border border-gray-700 rounded-md p-3 bg-gray-800 mb-4">
      <div className="flex-1 flex items-center gap-4">
        {/* Селектор проектов */}
        <div className="flex-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200"
              >
                <div className="flex items-center">
                  <Layers className="h-4 w-4 mr-2" />
                  {activeProject ? activeProject.name : 'Выберите проект'}
                </div>
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700 text-gray-200">
              <DropdownMenuLabel>Проекты</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700" />
              {projects.map(project => (
                <DropdownMenuItem 
                  key={project.id}
                  className="flex items-center cursor-pointer hover:bg-gray-700"
                  onClick={() => setActiveProject(project.id)}
                >
                  {activeProjectId === project.id && (
                    <Check className="h-4 w-4 mr-2 text-green-400" />
                  )}
                  <span className={activeProjectId === project.id ? "flex-1 font-medium" : "flex-1"}>
                    {project.name}
                  </span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem 
                className="flex items-center cursor-pointer hover:bg-gray-700"
                onClick={() => setShowNewProjectDialog(true)}
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Создать новый проект
              </DropdownMenuItem>
              {activeProject && (
                <>
                  <DropdownMenuItem 
                    className="flex items-center cursor-pointer hover:bg-gray-700"
                    onClick={() => setShowEditProjectDialog(true)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Редактировать проект
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Селектор профилей (только если выбран проект) */}
        {activeProject && (
          <div className="flex-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200"
                >
                  <div className="flex items-center">
                    <FilePlus className="h-4 w-4 mr-2" />
                    {activeProfile ? activeProfile.name : 'Базовые настройки'}
                  </div>
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700 text-gray-200">
                <DropdownMenuLabel>Профили</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem 
                  className="flex items-center cursor-pointer hover:bg-gray-700"
                  onClick={() => setActiveProfile(undefined)}
                >
                  {!activeProfile && (
                    <Check className="h-4 w-4 mr-2 text-green-400" />
                  )}
                  <span className={!activeProfile ? "flex-1 font-medium" : "flex-1"}>
                    Базовые настройки проекта
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-700" />
                {activeProject.profiles.map(profile => (
                  <DropdownMenuItem 
                    key={profile.id}
                    className="flex items-center cursor-pointer hover:bg-gray-700"
                    onClick={() => setActiveProfile(profile.id)}
                  >
                    {activeProfileId === profile.id && (
                      <Check className="h-4 w-4 mr-2 text-green-400" />
                    )}
                    <span className={activeProfileId === profile.id ? "flex-1 font-medium" : "flex-1"}>
                      {profile.name}
                    </span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem 
                  className="flex items-center cursor-pointer hover:bg-gray-700"
                  onClick={() => setShowNewProfileDialog(true)}
                >
                  <FilePlus className="h-4 w-4 mr-2" />
                  Создать новый профиль
                </DropdownMenuItem>
                {activeProfile && (
                  <>
                    <DropdownMenuItem 
                      className="flex items-center cursor-pointer hover:bg-gray-700"
                      onClick={() => setShowEditProfileDialog(true)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Редактировать профиль
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      
      {/* Диалоги для создания и редактирования */}
      <NewProjectDialog 
        isOpen={showNewProjectDialog} 
        onClose={() => setShowNewProjectDialog(false)} 
        createProject={storeCreateProject}
      />
      
      {activeProject && (
        <>
          <EditProjectDialog 
            isOpen={showEditProjectDialog} 
            onClose={() => setShowEditProjectDialog(false)}
            project={activeProject}
            updateProject={updateProject}
            deleteProject={deleteProject}
          />
          
          <NewProfileDialog 
            isOpen={showNewProfileDialog} 
            onClose={() => setShowNewProfileDialog(false)}
            projectId={activeProject.id}
            createProfile={storeCreateProfile}
          />
          
          {activeProfile && (
            <EditProfileDialog 
              isOpen={showEditProfileDialog} 
              onClose={() => setShowEditProfileDialog(false)}
              projectId={activeProject.id}
              profile={activeProfile}
              updateProfile={updateProfile}
              deleteProfile={deleteProfile}
            />
          )}
        </>
      )}
    </div>
  );
}

// Диалог создания нового проекта
interface NewProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  createProject: (name: string, description?: string) => Project;
}

function NewProjectDialog({ isOpen, onClose, createProject }: NewProjectDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  const handleSubmit = () => {
    if (!name.trim()) return;
    
    createProject(name.trim(), description.trim() || undefined);
    setName('');
    setDescription('');
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="bg-gray-800 border-gray-700 text-gray-100">
        <DialogHeader>
          <DialogTitle>Создать новый проект</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Название проекта</Label>
            <Input 
              id="project-name" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="bg-gray-700 border-gray-600 text-gray-200"
              placeholder="Введите название проекта"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="project-description">Описание (опционально)</Label>
            <Textarea 
              id="project-description" 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="bg-gray-700 border-gray-600 text-gray-200 min-h-20"
              placeholder="Введите описание проекта"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200">
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
            Создать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Диалог редактирования проекта
interface EditProjectDialogProps {
  isOpen: boolean; 
  onClose: () => void; 
  project: Project;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
}

function EditProjectDialog({ 
  isOpen, 
  onClose, 
  project,
  updateProject,
  deleteProject
}: EditProjectDialogProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const handleSubmit = () => {
    if (!name.trim()) return;
    
    updateProject(project.id, {
      name: name.trim(),
      description: description.trim() || undefined
    });
    onClose();
  };
  
  const handleDelete = () => {
    deleteProject(project.id);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="bg-gray-800 border-gray-700 text-gray-100">
        <DialogHeader>
          <DialogTitle>Редактировать проект</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="project-name-edit">Название проекта</Label>
            <Input 
              id="project-name-edit" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="bg-gray-700 border-gray-600 text-gray-200"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="project-description-edit">Описание (опционально)</Label>
            <Textarea 
              id="project-description-edit" 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="bg-gray-700 border-gray-600 text-gray-200 min-h-20"
            />
          </div>
          
          {!showDeleteConfirm ? (
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteConfirm(true)} 
              className="w-full mt-4"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить проект
            </Button>
          ) : (
            <div className="border border-red-800 bg-red-900/20 rounded-md p-3 mt-4">
              <p className="text-red-300 mb-2">Вы уверены, что хотите удалить этот проект и все его профили?</p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-700 border-gray-600"
                >
                  Отмена
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  className="flex-1"
                >
                  Подтвердить удаление
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200">
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Диалог создания нового профиля
interface NewProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  createProfile: (projectId: string, name: string, description?: string, inheritFromProject?: boolean) => Profile;
}

function NewProfileDialog({ 
  isOpen, 
  onClose, 
  projectId,
  createProfile
}: NewProfileDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [inheritSettings, setInheritSettings] = useState(true);
  
  const handleSubmit = () => {
    if (!name.trim()) return;
    
    createProfile(
      projectId, 
      name.trim(), 
      description.trim() || undefined, 
      inheritSettings
    );
    setName('');
    setDescription('');
    setInheritSettings(true);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="bg-gray-800 border-gray-700 text-gray-100">
        <DialogHeader>
          <DialogTitle>Создать новый профиль</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Название профиля</Label>
            <Input 
              id="profile-name" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="bg-gray-700 border-gray-600 text-gray-200"
              placeholder="Введите название профиля"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="profile-description">Описание (опционально)</Label>
            <Textarea 
              id="profile-description" 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="bg-gray-700 border-gray-600 text-gray-200 min-h-20"
              placeholder="Введите описание профиля"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="inherit-settings"
              checked={inheritSettings}
              onCheckedChange={(checked) => setInheritSettings(checked as boolean)}
              className="border-gray-600 data-[state=checked]:bg-blue-600"
            />
            <Label htmlFor="inherit-settings" className="text-sm text-gray-300">
              Наследовать настройки из базовых настроек проекта
            </Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200">
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
            Создать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Диалог редактирования профиля
interface EditProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  profile: Profile;
  updateProfile: (projectId: string, profileId: string, updates: Partial<Profile>) => void;
  deleteProfile: (projectId: string, profileId: string) => void;
}

function EditProfileDialog({ 
  isOpen, 
  onClose, 
  projectId,
  profile,
  updateProfile,
  deleteProfile
}: EditProfileDialogProps) {
  const [name, setName] = useState(profile.name);
  const [description, setDescription] = useState(profile.description || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const handleSubmit = () => {
    if (!name.trim()) return;
    
    updateProfile(projectId, profile.id, {
      name: name.trim(),
      description: description.trim() || undefined
    });
    onClose();
  };
  
  const handleDelete = () => {
    deleteProfile(projectId, profile.id);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="bg-gray-800 border-gray-700 text-gray-100">
        <DialogHeader>
          <DialogTitle>Редактировать профиль</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name-edit">Название профиля</Label>
            <Input 
              id="profile-name-edit" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="bg-gray-700 border-gray-600 text-gray-200"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="profile-description-edit">Описание (опционально)</Label>
            <Textarea 
              id="profile-description-edit" 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="bg-gray-700 border-gray-600 text-gray-200 min-h-20"
            />
          </div>
          
          {!showDeleteConfirm ? (
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteConfirm(true)} 
              className="w-full mt-4"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить профиль
            </Button>
          ) : (
            <div className="border border-red-800 bg-red-900/20 rounded-md p-3 mt-4">
              <p className="text-red-300 mb-2">Вы уверены, что хотите удалить этот профиль?</p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-700 border-gray-600"
                >
                  Отмена
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  className="flex-1"
                >
                  Подтвердить удаление
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200">
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Не забудьте импортировать Checkbox
import { Checkbox } from '@/components/ui/checkbox';
