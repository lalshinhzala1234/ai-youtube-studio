'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LandingPage } from '@/components/landing/LandingPage';
import { Sidebar, DashboardNavView } from '@/components/navigation/Sidebar';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { NewProjectView } from '@/components/new-project/NewProjectView';
import { ProjectWorkspace } from '@/components/workspace/ProjectWorkspace';
import { TemplatesView } from '@/components/templates/TemplatesView';
import { SettingsView } from '@/components/settings/SettingsView';
import { useAuth } from '@/context/AuthContext';
import {
  fetchUserProjects,
  saveUserProjectToCloud,
  deleteUserProjectFromCloud,
  migrateLocalProjectsToCloud,
} from '@/lib/supabase/projects';
import {
  YouTubeProject,
  WorkspaceTab,
} from '@/types/project';
import {
  loadAllProjects,
  saveProject,
  deleteProject,
  createNewProjectPlaceholder,
  getActiveProjectId,
  setActiveProjectId,
  createSampleProject,
} from '@/lib/storage/projectStore';
import { FolderKanban, PlusCircle, Trash2, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const { user, loading: authLoading, openAuthModal } = useAuth();
  const [projects, setProjects] = useState<YouTubeProject[]>([]);
  const [activeProject, setActiveProject] = useState<YouTubeProject | null>(null);
  const [currentView, setCurrentView] = useState<DashboardNavView>('landing');
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [mounted, setMounted] = useState(false);

  // Synchronize projects with user authentication state
  useEffect(() => {
    setMounted(true);
    let isCancelled = false;

    async function syncUserData() {
      if (user) {
        // Fetch cloud projects for authenticated user
        const { data: cloudProjects } = await fetchUserProjects(user.id);
        
        // Check if there are local projects from guest mode that need migration
        const localProjects = loadAllProjects();
        if (localProjects.length > 0 && cloudProjects.length === 0) {
          await migrateLocalProjectsToCloud(user.id, localProjects);
          const { data: refreshed } = await fetchUserProjects(user.id);
          if (!isCancelled) {
            setProjects(refreshed);
            if (refreshed.length > 0) {
              setActiveProject(refreshed[0]);
              setActiveProjectId(refreshed[0].id);
            }
          }
        } else {
          if (!isCancelled) {
            setProjects(cloudProjects);
            if (cloudProjects.length > 0) {
              setActiveProject(cloudProjects[0]);
              setActiveProjectId(cloudProjects[0].id);
            } else {
              setActiveProject(null);
            }
          }
        }
      } else {
        // Guest mode / offline fallback
        const localProjects = loadAllProjects();
        if (!isCancelled) {
          setProjects(localProjects);
          const activeId = getActiveProjectId();
          if (activeId) {
            const found = localProjects.find((p) => p.id === activeId);
            if (found) {
              setActiveProject(found);
            } else if (localProjects.length > 0) {
              setActiveProject(localProjects[0]);
            }
          } else if (localProjects.length > 0) {
            setActiveProject(localProjects[0]);
          } else {
            setActiveProject(null);
          }
        }
      }
    }

    syncUserData();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  const handleSelectProject = (project: YouTubeProject) => {
    setActiveProject(project);
    setActiveProjectId(project.id);
    setCurrentView('workspace' as DashboardNavView);
  };

  const handleUpdateProject = async (updatedProject: YouTubeProject) => {
    saveProject(updatedProject);
    if (user) {
      await saveUserProjectToCloud(user.id, updatedProject);
      const { data: refreshed } = await fetchUserProjects(user.id);
      setProjects(refreshed);
    } else {
      const updatedAll = loadAllProjects();
      setProjects(updatedAll);
    }
    setActiveProject(updatedProject);
  };

  const handleCreateProject = async (
    idea: string,
    settings: YouTubeProject['settings'],
    overrides?: {
      story?: YouTubeProject['story'];
      concept?: YouTubeProject['concept'];
      hook?: YouTubeProject['hook'];
      script?: YouTubeProject['script'];
    }
  ) => {
    const newProj = createNewProjectPlaceholder(idea, settings, overrides);
    saveProject(newProj);
    if (user) {
      await saveUserProjectToCloud(user.id, newProj);
      const { data: refreshed } = await fetchUserProjects(user.id);
      setProjects(refreshed);
    } else {
      const updatedAll = loadAllProjects();
      setProjects(updatedAll);
    }
    setActiveProject(newProj);
    setActiveProjectId(newProj.id);
    setCurrentView('workspace' as DashboardNavView);
    setActiveTab('overview');
  };

  const handleLandingCreatePackage = (idea: string) => {
    const defaultSettings: YouTubeProject['settings'] = {
      videoType: idea.toLowerCase().includes('kids') || idea.toLowerCase().includes('abc')
        ? 'Kids'
        : idea.toLowerCase().includes('krishna') || idea.toLowerCase().includes('myth')
        ? 'Story'
        : 'Explainer',
      audience: idea.toLowerCase().includes('kids') ? 'Kids' : 'General',
      language: 'English',
      duration: '3 minutes',
      format: 'YouTube Long Form',
      visualStyle: idea.toLowerCase().includes('kids') || idea.toLowerCase().includes('abc')
        ? '3D Cartoon'
        : 'Cinematic',
      tone: idea.toLowerCase().includes('kids') || idea.toLowerCase().includes('abc')
        ? 'Fun'
        : 'Educational',
      narration: 'Voiceover',
      sceneCount: 6,
      aspectRatio: '9:16',
      targetDuration: '3 minutes',
      targetPace: 'Dynamic & Engaging (3-5s cuts)',
      targetScenesCount: 6,
      includeCharacters: true,
    };
    handleCreateProject(idea, defaultSettings);
  };

  const handleDeleteProject = async (projectId: string) => {
    deleteProject(projectId);
    if (user) {
      await deleteUserProjectFromCloud(user.id, projectId);
      const { data: refreshed } = await fetchUserProjects(user.id);
      setProjects(refreshed);
      if (activeProject?.id === projectId) {
        if (refreshed.length > 0) {
          setActiveProject(refreshed[0]);
          setActiveProjectId(refreshed[0].id);
        } else {
          setActiveProject(null);
          setCurrentView('dashboard');
        }
      }
    } else {
      const updated = loadAllProjects();
      setProjects(updated);
      if (activeProject?.id === projectId) {
        if (updated.length > 0) {
          setActiveProject(updated[0]);
          setActiveProjectId(updated[0].id);
        } else {
          setActiveProject(null);
          setCurrentView('dashboard');
        }
      }
    }
  };

  const handleResetStorage = async () => {
    localStorage.removeItem('yt_studio_projects_v2');
    localStorage.removeItem('yt_studio_active_id');
    const sample = createSampleProject();
    saveProject(sample);
    if (user) {
      await saveUserProjectToCloud(user.id, sample);
      const { data: refreshed } = await fetchUserProjects(user.id);
      setProjects(refreshed);
    } else {
      const updated = [sample];
      setProjects(updated);
    }
    setActiveProject(sample);
    setActiveProjectId(sample.id);
    setCurrentView('dashboard');
  };

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Page 1: Landing Page
  if (currentView === 'landing') {
    return (
      <LandingPage
        onGetStarted={() => {
          setCurrentView('dashboard');
        }}
        onCreatePackage={handleLandingCreatePackage}
        onOpenDashboard={() => setCurrentView('dashboard')}
      />
    );
  }

  // Page 3: Project Workspace (Full Application Layout)
  if (currentView === ('workspace' as DashboardNavView) && activeProject) {
    return (
      <ProjectWorkspace
        project={activeProject}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onBackToDashboard={() => setCurrentView('dashboard')}
        onUpdateProject={handleUpdateProject}
      />
    );
  }

  // Page 2: Dashboard Layout with Responsive Left Sidebar
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090c10]">
      {/* Desktop & Mobile SaaS Left Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        activeProject={activeProject}
        allProjects={projects}
        onSelectProject={handleSelectProject}
        onOpenLanding={() => setCurrentView('landing')}
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area with Mobile Top Bar */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Mobile Header Bar */}
        <div className="md:hidden px-4 py-3 bg-[#0d1117] border-b border-[#21262d] flex items-center justify-between shrink-0">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-lg bg-[#161b22] border border-[#30363d] text-gray-300 hover:text-white"
            aria-label="Open Navigation Menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-red-600 flex items-center justify-center">
              <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[7px] border-l-white border-b-[4px] border-b-transparent ml-0.5" />
            </div>
            <span className="font-bold text-xs text-white">AI YouTube Studio</span>
          </div>

          <button
            onClick={() => setCurrentView('new-project')}
            className="p-1.5 rounded-lg bg-red-600 text-white text-xs font-bold"
            aria-label="New Project"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Main Area Views */}
        <div className="flex-1 flex overflow-hidden">
          {currentView === 'dashboard' && (
            <DashboardView
              projects={projects}
              onOpenProject={handleSelectProject}
              onCreateNewClick={() => setCurrentView('new-project')}
              onDeleteProject={handleDeleteProject}
            />
          )}

          {currentView === 'new-project' && (
            <NewProjectView
              onCancel={() => setCurrentView('dashboard')}
              onCreateProject={handleCreateProject}
            />
          )}

          {currentView === 'projects' && (
            <div className="flex-1 overflow-y-auto bg-[#090c10] text-[#f0f6fc] p-4 sm:p-6 lg:p-10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    <FolderKanban className="w-6 h-6 text-red-500" />
                    All YouTube Projects ({projects.length})
                  </h1>
                  <p className="text-xs text-gray-400 mt-1">
                    Manage your saved YouTube video packages, drafts, and production assets.
                  </p>
                </div>
                <button
                  onClick={() => setCurrentView('new-project')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-600/20 min-h-[44px]"
                >
                  <PlusCircle className="w-4 h-4" />
                  New Project
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-5 rounded-xl bg-[#161b22] border border-[#30363d] flex flex-col justify-between space-y-4 hover:border-red-500/50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/60 text-red-300 border border-red-800/40">
                          {proj.settings.videoType}
                        </span>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${proj.idea}"?`)) {
                              handleDeleteProject(proj.id);
                            }
                          }}
                          className="p-1.5 text-gray-500 hover:text-red-400 transition-colors min-h-[32px]"
                          aria-label="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h3 className="font-bold text-sm text-white line-clamp-2">{proj.idea}</h3>
                      <p className="text-xs text-gray-400 mt-2 line-clamp-2">{proj.concept.premise}</p>
                    </div>

                    <div className="pt-3 border-t border-[#21262d] flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-mono">
                        {proj.settings.targetDuration}
                      </span>
                      <button
                        onClick={() => handleSelectProject(proj)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-300 min-h-[36px] py-1"
                      >
                        Open Workspace <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentView === 'templates' && (
            <TemplatesView
              onUseTemplate={(idea, settings) => {
                handleCreateProject(idea, settings);
              }}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView onClearStorage={handleResetStorage} />
          )}
        </div>
      </div>
    </div>
  );
}

