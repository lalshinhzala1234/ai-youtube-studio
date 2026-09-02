import { getSupabaseClient, isSupabaseConfigured } from './client';
import { YouTubeProject } from '@/types/project';

export interface DbProjectRow {
  id: string;
  user_id: string;
  title: string;
  idea: string;
  settings: any;
  concept: any;
  hook: any;
  script: any;
  characters: any;
  scenes: any;
  video_prompts: any;
  thumbnail: any;
  youtube_seo: any;
  shorts: any;
  created_at: string;
  updated_at: string;
}

// Convert a YouTubeProject domain model to a Supabase DB row
export function projectToDbRow(project: YouTubeProject, userId: string): DbProjectRow {
  return {
    id: project.id || project.projectId || `proj-${Date.now()}`,
    user_id: userId,
    title: project.title || project.idea || 'Untitled Project',
    idea: project.idea || project.title || 'Untitled Project',
    settings: project.settings || {},
    concept: project.concept || {},
    hook: project.hook || {},
    script: project.script || {},
    characters: project.characters || [],
    scenes: project.scenes || [],
    video_prompts: project.videoPrompts || [],
    thumbnail: project.thumbnail || {},
    youtube_seo: project.youtubeSeo || {},
    shorts: project.shorts || {},
    created_at: project.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// Convert a Supabase DB row to a YouTubeProject domain model
export function dbRowToProject(row: DbProjectRow): YouTubeProject {
  return {
    id: row.id,
    projectId: row.id,
    title: row.title || row.idea,
    idea: row.idea || row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    settings: row.settings || {},
    concept: row.concept || {},
    hook: row.hook || {},
    script: row.script || {},
    characters: Array.isArray(row.characters) ? row.characters : [],
    scenes: Array.isArray(row.scenes) ? row.scenes : [],
    videoPrompts: Array.isArray(row.video_prompts) ? row.video_prompts : [],
    thumbnail: row.thumbnail || {},
    youtubeSeo: row.youtube_seo || {},
    shorts: row.shorts || {},
  };
}

// Local mock storage partitioned per user for offline / test environments
const LOCAL_USER_PROJECTS_PREFIX = 'ai_yt_studio_user_projects_';

function getLocalMockUserProjects(userId: string): YouTubeProject[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_USER_PROJECTS_PREFIX + userId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalMockUserProjects(userId: string, projects: YouTubeProject[]) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_USER_PROJECTS_PREFIX + userId, JSON.stringify(projects));
  } catch (err) {
    console.error('Failed to save mock user projects:', err);
  }
}

/**
 * Fetch all projects for an authenticated user from Supabase (or offline fallback)
 */
export async function fetchUserProjects(userId: string): Promise<{ data: YouTubeProject[]; error: string | null }> {
  if (!userId) {
    return { data: [], error: 'User ID is required to fetch projects.' };
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetchUserProjects warning:', error.message);
        // Fallback to partitioned local cache if table is not yet created or inaccessible
        const mockProjects = getLocalMockUserProjects(userId);
        return { data: mockProjects, error: error.message };
      }

      const projects = (data as DbProjectRow[]).map(dbRowToProject);
      // Cache locally for offline availability
      saveLocalMockUserProjects(userId, projects);
      return { data: projects, error: null };
    } catch (err: any) {
      console.warn('Supabase fetchUserProjects exception:', err);
      const mockProjects = getLocalMockUserProjects(userId);
      return { data: mockProjects, error: err?.message || 'Failed to fetch cloud projects.' };
    }
  }

  // Fallback to partitioned local user storage
  const mockProjects = getLocalMockUserProjects(userId);
  return { data: mockProjects, error: null };
}

/**
 * Save or update a project for an authenticated user in Supabase
 */
export async function saveUserProjectToCloud(
  userId: string,
  project: YouTubeProject
): Promise<{ data: YouTubeProject | null; error: string | null }> {
  if (!userId) {
    return { data: null, error: 'User ID is required to save project to cloud.' };
  }

  const row = projectToDbRow(project, userId);
  const client = getSupabaseClient();

  // Always update local cache for offline resilience
  const mockList = getLocalMockUserProjects(userId);
  const idx = mockList.findIndex((p) => p.id === project.id);
  const updatedProj = dbRowToProject(row);
  if (idx >= 0) {
    mockList[idx] = updatedProj;
  } else {
    mockList.unshift(updatedProj);
  }
  saveLocalMockUserProjects(userId, mockList);

  if (client) {
    try {
      const { data, error } = await client
        .from('projects')
        .upsert(row, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.warn('Supabase saveUserProject warning:', error.message);
        return { data: updatedProj, error: error.message };
      }

      const savedProj = dbRowToProject(data as DbProjectRow);
      return { data: savedProj, error: null };
    } catch (err: any) {
      console.warn('Supabase saveUserProject exception:', err);
      return { data: updatedProj, error: err?.message || 'Failed to save project to cloud.' };
    }
  }

  return { data: updatedProj, error: null };
}

/**
 * Delete a project for an authenticated user in Supabase
 */
export async function deleteUserProjectFromCloud(
  userId: string,
  projectId: string
): Promise<{ success: boolean; error: string | null }> {
  if (!userId || !projectId) {
    return { success: false, error: 'User ID and Project ID are required.' };
  }

  // Always remove from local cache
  const mockList = getLocalMockUserProjects(userId).filter((p) => p.id !== projectId);
  saveLocalMockUserProjects(userId, mockList);

  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', userId);

      if (error) {
        console.warn('Supabase deleteUserProject warning:', error.message);
        return { success: true, error: error.message };
      }
      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Supabase deleteUserProject exception:', err);
      return { success: true, error: err?.message || 'Failed to delete project.' };
    }
  }

  return { success: true, error: null };
}

/**
 * Safe Migration: Upload any local-storage projects to the newly logged-in user's Supabase account
 * without creating duplicates or overwriting existing cloud state.
 */
export async function migrateLocalProjectsToCloud(
  userId: string,
  localProjects: YouTubeProject[]
): Promise<{ migratedCount: number; error: string | null }> {
  if (!userId || !localProjects || localProjects.length === 0) {
    return { migratedCount: 0, error: null };
  }

  try {
    const { data: existingCloud } = await fetchUserProjects(userId);
    const existingIds = new Set(existingCloud.map((p) => p.id));

    let count = 0;
    for (const proj of localProjects) {
      // If the project doesn't exist yet in the cloud for this user, upload it
      if (!existingIds.has(proj.id)) {
        await saveUserProjectToCloud(userId, proj);
        count++;
      }
    }
    return { migratedCount: count, error: null };
  } catch (err: any) {
    console.error('Migration error:', err);
    return { migratedCount: 0, error: err?.message || 'Migration encountered an error.' };
  }
}
