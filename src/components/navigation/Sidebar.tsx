'use client';

import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  FolderKanban,
  LayoutTemplate,
  Settings,
  Play,
  Film,
  Sparkles,
  ExternalLink,
  ChevronRight,
  LogOut,
  LogIn,
  User as UserIcon,
  Cloud,
  X,
} from 'lucide-react';
import { YouTubeProject } from '@/types/project';
import { useAuth } from '@/context/AuthContext';

export type DashboardNavView = 'dashboard' | 'new-project' | 'projects' | 'templates' | 'settings' | 'landing';

interface SidebarProps {
  currentView: DashboardNavView;
  setCurrentView: (view: DashboardNavView) => void;
  allProjects: YouTubeProject[];
  activeProject: YouTubeProject | null;
  onSelectProject: (project: YouTubeProject) => void;
  onOpenLanding: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  allProjects,
  activeProject,
  onSelectProject,
  onOpenLanding,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { user, signOut, openAuthModal, isConfigured } = useAuth();

  const mainNavItems = [
    {
      id: 'dashboard' as DashboardNavView,
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'new-project' as DashboardNavView,
      label: 'New Project',
      icon: <PlusCircle className="w-4 h-4 text-red-400" />,
      highlight: true,
    },
    {
      id: 'projects' as DashboardNavView,
      label: 'My Projects',
      icon: <FolderKanban className="w-4 h-4" />,
      badge: allProjects.length,
    },
    {
      id: 'templates' as DashboardNavView,
      label: 'Templates',
      icon: <LayoutTemplate className="w-4 h-4" />,
    },
    {
      id: 'settings' as DashboardNavView,
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'YT';

  const handleNavClick = (viewId: DashboardNavView) => {
    setCurrentView(viewId);
    if (onCloseMobile) onCloseMobile();
  };

  const handleProjectClick = (p: YouTubeProject) => {
    onSelectProject(p);
    if (onCloseMobile) onCloseMobile();
  };

  const handleLandingClick = () => {
    onOpenLanding();
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 h-full bg-[#0d1117] border-r border-[#21262d] flex flex-col justify-between shrink-0 select-none transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="overflow-y-auto">
          <div className="p-4 md:p-5 border-b border-[#21262d] flex items-center justify-between">
            <div
              onClick={handleLandingClick}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
                <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
              </div>
              <div>
                <span className="font-bold text-sm text-white tracking-tight block">
                  AI YouTube Studio
                </span>
                <span className="text-[10px] text-gray-500 font-mono block">
                  Creator Suite v2.0
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#21262d] md:hidden"
                aria-label="Close Navigation"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Primary SaaS Nav Links */}
          <div className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Workspace
            </div>

            {mainNavItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] ${
                    isActive
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                      : 'text-gray-300 hover:text-white hover:bg-[#161b22]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#21262d] text-gray-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Project Shortcut */}
          {allProjects.length > 0 && (
            <div className="px-3 pt-2">
              <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                <span>Recent Projects</span>
                <Film className="w-3 h-3 text-gray-500" />
              </div>

              <div className="space-y-1 mt-1">
                {allProjects.slice(0, 3).map((p) => {
                  const isSelected = activeProject?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleProjectClick(p)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between group min-h-[38px] ${
                        isSelected
                          ? 'bg-[#161b22] text-white border border-[#30363d]'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-[#161b22]/50'
                      }`}
                    >
                      <span className="truncate pr-2">{p.idea}</span>
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-gray-400 shrink-0 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer User / Auth / Website Bar */}
        <div className="p-3 border-t border-[#21262d] space-y-2 shrink-0">
          <button
            onClick={handleLandingClick}
            className="w-full px-3 py-2 rounded-lg bg-[#161b22] hover:bg-[#21262d] text-gray-300 hover:text-white text-xs font-medium transition-colors flex items-center justify-between min-h-[40px]"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Landing Page
            </span>
            <ExternalLink className="w-3 h-3 text-gray-500" />
          </button>

          {user ? (
            <div className="p-2.5 rounded-xl bg-[#161b22] border border-[#21262d] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shrink-0">
                  {userInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{user.email}</p>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <Cloud className="w-2.5 h-2.5" />
                    <span>Cloud Synced</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => signOut()}
                title="Sign Out"
                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-[#21262d] rounded-lg transition-colors shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="w-full p-2.5 rounded-xl bg-gradient-to-r from-red-600/20 to-rose-600/20 hover:from-red-600/30 hover:to-rose-600/30 border border-red-500/30 text-white flex items-center justify-center gap-2 text-xs font-semibold transition-all shadow-sm min-h-[44px]"
            >
              <LogIn className="w-3.5 h-3.5 text-red-400" />
              <span>Sign In / Sign Up</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};


