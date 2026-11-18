import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle,
  Film,
  FolderPlus,
  Image as ImageIcon,
  Layers,
  LogOut,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  getProjectCategoryName,
  getProjectThumbnail,
  hecticApi,
} from '../api/hecticApi';
import type {
  Category,
  EditorInquiry,
  EditorMediaPayload,
  EditorProjectPayload,
  Project,
  ProjectMedia,
} from '../api/types';
import { HecticLogoMark } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export function EditorDashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'projects' | 'media' | 'inquiries'>('projects');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Projects State
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Project Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState<number | string>('');
  const [client, setClient] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [isSavingProject, setIsSavingProject] = useState(false);

  // Media State
  const [mediaList, setMediaList] = useState<ProjectMedia[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [selectedProjectForMedia, setSelectedProjectForMedia] = useState<string | number>('');
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<ProjectMedia | null>(null);

  // Media Form State
  const [mediaType, setMediaType] = useState<'video' | 'image'>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [mediaOrder, setMediaOrder] = useState<number>(0);
  const [isSavingMedia, setIsSavingMedia] = useState(false);

  // Inquiries State
  const [inquiries, setInquiries] = useState<EditorInquiry[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);

  // Clear feedback after 4 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Load Projects & Categories
  const loadProjectsAndCategories = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const [projRes, catRes] = await Promise.all([
        hecticApi.getEditorProjects({ page: 1 }),
        hecticApi.getEditorCategories({ page: 1 }).catch(() => hecticApi.getCategories({ page: 1 })),
      ]);
      setProjects(projRes.results ?? []);
      setCategories(catRes.results ?? []);
      if (catRes.results?.length && !categoryId) {
        setCategoryId(catRes.results[0].id);
      }
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to load projects.',
      });
    } finally {
      setProjectsLoading(false);
    }
  }, [categoryId]);

  // Load Media
  const loadMedia = useCallback(async (projectId?: string | number) => {
    setMediaLoading(true);
    try {
      const res = await hecticApi.getEditorMedia({
        page: 1,
        project: projectId || undefined,
      });
      setMediaList(res.results ?? []);
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to load media records.',
      });
    } finally {
      setMediaLoading(false);
    }
  }, []);

  // Load Inquiries
  const loadInquiries = useCallback(async () => {
    setInquiriesLoading(true);
    try {
      const res = await hecticApi.getEditorInquiries({ page: 1 });
      setInquiries(res.results ?? []);
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to load inquiries.',
      });
    } finally {
      setInquiriesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjectsAndCategories();
  }, [loadProjectsAndCategories]);

  useEffect(() => {
    if (activeTab === 'media') {
      loadMedia(selectedProjectForMedia);
    } else if (activeTab === 'inquiries') {
      loadInquiries();
    }
  }, [activeTab, selectedProjectForMedia, loadMedia, loadInquiries]);

  // Handle Logout
  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Open Project Modal for Create
  const handleOpenCreateProject = () => {
    setEditingProject(null);
    setTitle('');
    setSlug('');
    setCategoryId(categories[0]?.id || '');
    setClient('');
    setYear(new Date().getFullYear());
    setDescription('');
    setCoverImage('');
    setIsPublished(true);
    setIsActive(true);
    setDisplayOrder(0);
    setProjectModalOpen(true);
  };

  // Open Project Modal for Edit
  const handleOpenEditProject = (proj: Project) => {
    setEditingProject(proj);
    setTitle(proj.title || '');
    setSlug(proj.slug || '');
    const cId =
      typeof proj.category === 'object' && proj.category !== null
        ? proj.category.id
        : proj.category || categories[0]?.id || '';
    setCategoryId(cId || '');
    setClient(proj.client || proj.client_name || '');
    setYear(Number(proj.year || proj.release_year) || new Date().getFullYear());
    setDescription(proj.description || proj.summary || '');
    setCoverImage(proj.cover_image || proj.thumbnail || proj.image || '');
    setIsPublished(proj.status !== false);
    setIsActive(proj.active_status !== false);
    setDisplayOrder(proj.display_order ?? proj.order ?? 0);
    setProjectModalOpen(true);
  };

  // Save Project (Create or Update)
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !categoryId) {
      setFeedback({ type: 'error', message: 'Title and Category are required.' });
      return;
    }

    setIsSavingProject(true);
    const payload: EditorProjectPayload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      category: categoryId,
      client: client.trim(),
      year: Number(year),
      description: description.trim(),
      cover_image: coverImage.trim(),
      status: isPublished,
      active_status: isActive,
      display_order: Number(displayOrder) || 0,
    };

    try {
      if (editingProject) {
        await hecticApi.updateProject(editingProject.slug || editingProject.id, payload);
        setFeedback({ type: 'success', message: `Updated project "${payload.title}".` });
      } else {
        await hecticApi.createProject(payload);
        setFeedback({ type: 'success', message: `Created new project "${payload.title}".` });
      }
      setProjectModalOpen(false);
      await loadProjectsAndCategories();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error saving project.',
      });
    } finally {
      setIsSavingProject(false);
    }
  };

  // Toggle Project Published Status
  const handleTogglePublish = async (proj: Project) => {
    const nextStatus = !proj.status;
    try {
      await hecticApi.updateProject(proj.slug || proj.id, { status: nextStatus });
      setFeedback({
        type: 'success',
        message: `Project marked as ${nextStatus ? 'Published' : 'Draft'}.`,
      });
      await loadProjectsAndCategories();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to toggle status.',
      });
    }
  };

  // Delete Project
  const handleDeleteProject = async (proj: Project) => {
    if (!window.confirm(`Are you sure you want to delete project "${proj.title}"?`)) {
      return;
    }
    try {
      await hecticApi.deleteProject(proj.slug || proj.id);
      setFeedback({ type: 'success', message: `Deleted project "${proj.title}".` });
      await loadProjectsAndCategories();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to delete project.',
      });
    }
  };

  // Manage Media for Specific Project
  const handleManageMediaForProject = (proj: Project) => {
    setSelectedProjectForMedia(proj.id);
    setActiveTab('media');
  };

  // Open Media Modal for Create
  const handleOpenCreateMedia = () => {
    setEditingMedia(null);
    setMediaType('image');
    setMediaUrl('');
    setPosterUrl('');
    setCaption('');
    setMediaOrder(0);
    setMediaModalOpen(true);
  };

  // Save Media (Create or Update)
  const handleSaveMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetProject = selectedProjectForMedia || projects[0]?.id;
    if (!targetProject) {
      setFeedback({ type: 'error', message: 'Please select a project for this media.' });
      return;
    }
    if (!mediaUrl.trim()) {
      setFeedback({ type: 'error', message: 'Media URL is required.' });
      return;
    }

    setIsSavingMedia(true);
    const payload: EditorMediaPayload = {
      project: targetProject,
      media_type: mediaType,
      media_url: mediaUrl.trim(),
      poster_url: posterUrl.trim() || undefined,
      caption: caption.trim() || undefined,
      display_order: Number(mediaOrder) || 0,
    };

    try {
      if (editingMedia) {
        await hecticApi.updateMedia(editingMedia.id, payload);
        setFeedback({ type: 'success', message: 'Media item updated successfully.' });
      } else {
        await hecticApi.createMedia(payload);
        setFeedback({ type: 'success', message: 'Media item attached successfully.' });
      }
      setMediaModalOpen(false);
      await loadMedia(selectedProjectForMedia);
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error saving media.',
      });
    } finally {
      setIsSavingMedia(false);
    }
  };

  // Delete Media
  const handleDeleteMedia = async (item: ProjectMedia) => {
    if (!window.confirm('Delete this media item?')) return;
    try {
      await hecticApi.deleteMedia(item.id);
      setFeedback({ type: 'success', message: 'Media item deleted.' });
      await loadMedia(selectedProjectForMedia);
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to delete media.',
      });
    }
  };

  // Update Inquiry Status
  const handleUpdateInquiryStatus = async (inq: EditorInquiry, newStatus: string) => {
    try {
      await hecticApi.updateInquiryStatus(inq.id, newStatus);
      setFeedback({ type: 'success', message: `Inquiry status changed to ${newStatus}.` });
      await loadInquiries();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update inquiry status.',
      });
    }
  };

  // Filter projects by search
  const filteredProjects = projects.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const catName = getProjectCategoryName(p).toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      (p.client && p.client.toLowerCase().includes(q)) ||
      catName.includes(q)
    );
  });

  const publishedCount = projects.filter((p) => p.status !== false).length;
  const draftCount = projects.filter((p) => p.status === false).length;

  return (
    <div className="min-h-screen bg-[#F3F0E9] text-[#111110] selection:bg-[#14bfb9] selection:text-[#111110]">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 border-b border-[#111110]/10 bg-white/90 backdrop-blur-md px-5 py-3.5 md:px-8 shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="inline-flex items-center gap-2 text-[#111110] hover:opacity-75 transition-opacity">
              <HecticLogoMark className="h-6 w-6" />
              <span className="font-display text-sm tracking-wider uppercase font-semibold">
                Hectic Lab
              </span>
            </Link>
            <span className="hidden sm:inline-block rounded-full bg-[#14bfb9]/15 border border-[#14bfb9]/30 px-3 py-0.5 text-[10px] font-mono-hl uppercase tracking-wider text-[#0c7c76] font-medium">
              Editor Studio
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-5 text-xs font-mono-hl">
            <div className="hidden md:flex items-center gap-2 text-[#111110]/70">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Editor: <strong className="text-[#111110] font-semibold">{user?.username}</strong>
                {user?.is_superuser && ' (Superuser)'}
              </span>
            </div>

            <Link
              to="/work"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[#111110]/60 hover:text-[#14bfb9] transition-colors"
            >
              <span>View Public Site</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#111110]/15 bg-[#f4f3ee] px-3.5 py-1.5 text-xs text-[#111110] hover:bg-[#eae8df] transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Floating Feedback Notification */}
      {feedback && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl px-4 py-3 text-xs font-mono-hl shadow-2xl transition-all ${
            feedback.type === 'success'
              ? 'bg-[#111110] text-[#2cf5ef] border border-[#14bfb9]/40'
              : 'bg-rose-900 text-rose-100 border border-rose-700'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-[#2cf5ef]" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-300" />
          )}
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="ml-2 text-white/50 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Navigation Sub-Header */}
      <nav aria-label="Editor sections" className="border-b border-[#111110]/10 bg-white/50 px-5 md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 overflow-x-auto py-2.5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('projects')}
              className={`rounded-xl px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'projects'
                  ? 'bg-[#111110] text-[#2cf5ef] shadow-sm'
                  : 'text-[#111110]/60 hover:text-[#111110] hover:bg-[#111110]/5'
              }`}
            >
              <FolderPlus className="h-3.5 w-3.5" />
              <span>Projects ({projects.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('media')}
              className={`rounded-xl px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'media'
                  ? 'bg-[#111110] text-[#2cf5ef] shadow-sm'
                  : 'text-[#111110]/60 hover:text-[#111110] hover:bg-[#111110]/5'
              }`}
            >
              <Film className="h-3.5 w-3.5" />
              <span>Project Media</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('inquiries')}
              className={`rounded-xl px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'inquiries'
                  ? 'bg-[#111110] text-[#2cf5ef] shadow-sm'
                  : 'text-[#111110]/60 hover:text-[#111110] hover:bg-[#111110]/5'
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Client Inquiries ({inquiries.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'projects' && (
              <button
                type="button"
                onClick={handleOpenCreateProject}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#111110] px-4 py-2 text-xs font-medium uppercase tracking-wider text-[#2cf5ef] hover:bg-black transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>New Project</span>
              </button>
            )}

            {activeTab === 'media' && (
              <button
                type="button"
                onClick={handleOpenCreateMedia}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#111110] px-4 py-2 text-xs font-medium uppercase tracking-wider text-[#2cf5ef] hover:bg-black transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Add Media</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        {/* Quick Executive Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-[#111110]/10 rounded-2xl p-5 shadow-xs">
            <span className="font-mono-hl text-[11px] uppercase text-[#111110]/65 tracking-wider">
              Total Projects
            </span>
            <p className="font-display text-2xl sm:text-3xl font-medium mt-1 text-[#111110]">
              {projects.length}
            </p>
          </div>

          <div className="bg-white border border-[#111110]/10 rounded-2xl p-5 shadow-xs">
            <span className="font-mono-hl text-[11px] uppercase text-[#111110]/65 tracking-wider">
              Published Work
            </span>
            <p className="font-display text-2xl sm:text-3xl font-medium mt-1 text-emerald-600">
              {publishedCount}
            </p>
          </div>

          <div className="bg-white border border-[#111110]/10 rounded-2xl p-5 shadow-xs">
            <span className="font-mono-hl text-[11px] uppercase text-[#111110]/65 tracking-wider">
              Drafts / Inactive
            </span>
            <p className="font-display text-2xl sm:text-3xl font-medium mt-1 text-amber-600">
              {draftCount}
            </p>
          </div>

          <div className="bg-white border border-[#111110]/10 rounded-2xl p-5 shadow-xs">
            <span className="font-mono-hl text-[11px] uppercase text-[#111110]/65 tracking-wider">
              Client Inquiries
            </span>
            <p className="font-display text-2xl sm:text-3xl font-medium mt-1 text-[#0c7c76]">
              {inquiries.length}
            </p>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: PROJECTS */}
        {/* ============================================================== */}
        {activeTab === 'projects' && (
          <div>
            {/* Search and Filters */}
            <div className="mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#111110]/65" />
                <input
                  type="text"
                  placeholder="Search projects by title, client, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl bg-white border border-[#111110]/15 pl-10 pr-4 py-2.5 text-xs text-[#111110] placeholder-[#111110]/35 focus:border-[#14bfb9] focus:ring-2 focus:ring-[#14bfb9]/20 focus:outline-none shadow-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadProjectsAndCategories}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#111110]/15 bg-white px-4 py-2.5 text-xs font-mono-hl text-[#111110] hover:bg-[#f4f3ee] transition-colors cursor-pointer shadow-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Projects Table */}
            {projectsLoading ? (
              <div className="py-20 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#14bfb9] border-t-transparent" />
                <p className="mt-3 text-xs font-mono-hl text-[#111110]/65">Loading projects...</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="rounded-3xl border border-[#111110]/10 bg-white p-12 text-center shadow-xs">
                <FolderPlus className="mx-auto h-8 w-8 text-[#111110]/30 mb-3" />
                <h3 className="font-display text-lg uppercase tracking-tight">No projects found</h3>
                <p className="mt-1 text-xs font-mono-hl text-[#111110]/65">
                  {searchQuery ? 'Try clearing your search query.' : 'Create your first portfolio project to get started.'}
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreateProject}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#111110] px-4 py-2 text-xs font-medium text-[#2cf5ef] uppercase tracking-wider hover:bg-black transition-colors cursor-pointer shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Project</span>
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-[#111110]/10 bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[#111110]/10 bg-[#faf9f5] font-mono-hl uppercase text-[10px] text-[#111110]/60 tracking-wider">
                      <tr>
                        <th className="px-5 py-3.5">Project</th>
                        <th className="px-4 py-3.5">Category</th>
                        <th className="px-4 py-3.5">Client</th>
                        <th className="px-4 py-3.5">Year</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#111110]/5 font-mono-hl">
                      {filteredProjects.map((proj) => {
                        const thumb = getProjectThumbnail(proj);
                        const catName = getProjectCategoryName(proj);

                        return (
                          <tr key={proj.id} className="hover:bg-[#faf9f5] transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-12 rounded-lg bg-[#e8e7e1] overflow-hidden shrink-0 border border-[#111110]/10 shadow-2xs">
                                  {thumb ? (
                                    <img
                                      src={thumb}
                                      alt={proj.title}
                                      loading="lazy"
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center text-[9px] text-[#111110]/65">
                                      NO IMG
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <Link
                                    to={`/projects/${proj.slug}`}
                                    target="_blank"
                                    className="font-medium text-[#111110] hover:text-[#0c7c76] transition-colors truncate block text-sm"
                                  >
                                    {proj.title}
                                  </Link>
                                  <span className="text-[10px] text-[#111110]/65 truncate block">
                                    /{proj.slug}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="rounded-md bg-[#f4f3ee] border border-[#111110]/10 px-2 py-0.5 text-[11px] text-[#111110]/80">
                                {catName}
                              </span>
                            </td>

                            <td className="px-4 py-4 text-[#111110]/70 whitespace-nowrap">
                              {proj.client || proj.client_name || '—'}
                            </td>

                            <td className="px-4 py-4 text-[#111110]/60 whitespace-nowrap">
                              {proj.year || proj.release_year || '—'}
                            </td>

                            <td className="px-4 py-4 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleTogglePublish(proj)}
                                title="Click to toggle publish status"
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-medium transition-all cursor-pointer ${
                                  proj.status !== false
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                                }`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${proj.status !== false ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                <span>{proj.status !== false ? 'Published' : 'Draft'}</span>
                              </button>
                            </td>

                            <td className="px-5 py-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleManageMediaForProject(proj)}
                                  title="Manage Project Media"
                                  className="rounded-lg p-2 text-[#111110]/60 hover:text-[#0c7c76] hover:bg-[#14bfb9]/10 transition-colors cursor-pointer"
                                >
                                  <Film className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditProject(proj)}
                                  title="Edit Project Details"
                                  className="rounded-lg p-2 text-[#111110]/60 hover:text-[#111110] hover:bg-[#f4f3ee] transition-colors cursor-pointer"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProject(proj)}
                                  title="Delete Project"
                                  className="rounded-lg p-2 text-[#111110]/60 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: MEDIA MANAGEMENT */}
        {/* ============================================================== */}
        {activeTab === 'media' && (
          <div>
            <div className="mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="flex items-center gap-3">
                <label htmlFor="media-project-select" className="text-xs font-mono-hl text-[#111110]/70 whitespace-nowrap">
                  Filter by Project:
                </label>
                <select
                  id="media-project-select"
                  aria-label="Filter media by project"
                  value={selectedProjectForMedia}
                  onChange={(e) => setSelectedProjectForMedia(e.target.value)}
                  className="rounded-xl bg-white border border-[#111110]/15 px-3.5 py-2 text-xs text-[#111110] focus:border-[#14bfb9] focus:outline-none shadow-xs"
                >
                  <option value="">All Projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadMedia(selectedProjectForMedia)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#111110]/15 bg-white px-3.5 py-2 text-xs font-mono-hl text-[#111110] hover:bg-[#f4f3ee] transition-colors cursor-pointer shadow-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Refresh</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenCreateMedia}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#111110] px-4 py-2 text-xs font-medium uppercase tracking-wider text-[#2cf5ef] hover:bg-black transition-all shadow-xs cursor-pointer shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Media</span>
                </button>
              </div>
            </div>

            {mediaLoading ? (
              <div className="py-20 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#14bfb9] border-t-transparent" />
                <p className="mt-3 text-xs font-mono-hl text-[#111110]/65">Loading media records...</p>
              </div>
            ) : mediaList.length === 0 ? (
              <div className="rounded-3xl border border-[#111110]/10 bg-white p-12 text-center shadow-xs">
                <Film className="mx-auto h-8 w-8 text-[#111110]/30 mb-3" />
                <h3 className="font-display text-lg uppercase tracking-tight">No media items found</h3>
                <p className="mt-1 text-xs font-mono-hl text-[#111110]/65">
                  Attach images or videos to showcase your project work.
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreateMedia}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#111110] px-4 py-2 text-xs font-medium text-[#2cf5ef] uppercase tracking-wider hover:bg-black transition-colors cursor-pointer shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add First Media</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {mediaList.map((item) => {
                  const isVideo = (item.media_type || item.type || '').toLowerCase().includes('video');
                  const src = item.url || item.media_url || item.file || item.video_url || item.image || '';

                  return (
                    <div
                      key={item.id}
                      className="group overflow-hidden rounded-2xl border border-[#111110]/10 bg-white flex flex-col justify-between shadow-xs hover:shadow-md transition-all"
                    >
                      <div className="relative aspect-video bg-[#e8e7e1] overflow-hidden">
                        {isVideo ? (
                          <div className="h-full w-full flex flex-col items-center justify-center bg-[#111110] text-white">
                            <Film className="h-8 w-8 text-[#2cf5ef] mb-1" />
                            <span className="text-[10px] font-mono-hl text-white/70">Video Player</span>
                          </div>
                        ) : src ? (
                          <img
                            src={src}
                            alt={item.caption || 'Project media'}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs font-mono-hl text-[#111110]/65">
                            No source
                          </div>
                        )}

                        <span className="absolute top-3 left-3 rounded-md bg-[#111110]/80 backdrop-blur-xs px-2.5 py-1 text-[10px] font-mono-hl uppercase tracking-wider text-[#2cf5ef]">
                          {isVideo ? 'Video' : 'Image'}
                        </span>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <p className="text-xs font-medium text-[#111110] truncate">
                            {item.caption || 'Untitled Media'}
                          </p>
                          <p className="mt-1 text-[10px] font-mono-hl text-[#111110]/65 truncate">
                            {src}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#111110]/5 flex items-center justify-between">
                          <span className="text-[10px] font-mono-hl text-[#111110]/65">
                            Order: {item.order ?? item.display_order ?? 0}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteMedia(item)}
                            className="rounded-lg p-1.5 text-[#111110]/65 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete media"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: INQUIRIES */}
        {/* ============================================================== */}
        {activeTab === 'inquiries' && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl uppercase tracking-tight">Client Leads & Inquiries</h2>
                <p className="text-xs font-mono-hl text-[#111110]/65 mt-0.5">
                  Incoming contact submissions from your public portfolio
                </p>
              </div>
              <button
                type="button"
                onClick={loadInquiries}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#111110]/15 bg-white px-3.5 py-2 text-xs font-mono-hl text-[#111110] hover:bg-[#f4f3ee] transition-colors cursor-pointer shadow-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {inquiriesLoading ? (
              <div className="py-20 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#14bfb9] border-t-transparent" />
                <p className="mt-3 text-xs font-mono-hl text-[#111110]/65">Loading inquiries...</p>
              </div>
            ) : inquiries.length === 0 ? (
              <div className="rounded-3xl border border-[#111110]/10 bg-white p-12 text-center shadow-xs">
                <Mail className="mx-auto h-8 w-8 text-[#111110]/30 mb-3" />
                <h3 className="font-display text-lg uppercase tracking-tight">No inquiries yet</h3>
                <p className="mt-1 text-xs font-mono-hl text-[#111110]/65">
                  New project leads submitted from the public inquiry form will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {inquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className="rounded-2xl border border-[#111110]/10 bg-white p-6 shadow-xs hover:border-[#14bfb9]/60 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
                      <div>
                        <span className="font-display text-base font-medium tracking-tight text-[#111110]">
                          {inq.name}
                        </span>
                        {inq.company && (
                          <span className="ml-2 text-xs font-mono-hl text-[#0c7c76] font-medium">
                            • {inq.company}
                          </span>
                        )}
                        <a
                          href={`mailto:${inq.email}`}
                          className="block text-xs font-mono-hl text-[#111110]/60 hover:text-[#0c7c76] hover:underline mt-0.5"
                        >
                          {inq.email}
                        </a>
                      </div>

                      <div className="flex items-center gap-3">
                        <select
                          aria-label={`Update status for ${inq.name}'s inquiry`}
                          value={inq.status}
                          onChange={(e) => handleUpdateInquiryStatus(inq, e.target.value)}
                          className="rounded-xl bg-[#faf9f5] border border-[#111110]/15 px-3.5 py-1.5 text-xs font-mono-hl text-[#111110] focus:outline-none focus:border-[#14bfb9] shadow-2xs"
                        >
                          <option value="new">Status: New</option>
                          <option value="contacted">Status: Contacted</option>
                          <option value="in_progress">Status: In Progress</option>
                          <option value="completed">Status: Completed</option>
                        </select>
                      </div>
                    </div>

                    <div className="mb-3.5 rounded-xl bg-[#faf9f5] border border-[#111110]/5 p-4 text-xs text-[#111110]/80 font-mono-hl leading-relaxed whitespace-pre-wrap">
                      {inq.message}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-hl text-[#111110]/65 pt-3 border-t border-[#111110]/5">
                      <div>
                        {inq.service_title && <span className="font-medium text-[#111110]/70">Service: {inq.service_title} • </span>}
                        {inq.budget_range && <span>Budget: {inq.budget_range}</span>}
                      </div>
                      <span>
                        Received: {new Date(inq.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* MODAL: CREATE / EDIT PROJECT */}
      {/* ============================================================== */}
      {projectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl border border-[#111110]/15 bg-white p-7 sm:p-8 shadow-2xl relative my-8 text-[#111110]">
            <button
              type="button"
              onClick={() => setProjectModalOpen(false)}
              className="absolute top-6 right-6 text-[#111110]/65 hover:text-[#111110] transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="font-display text-xl uppercase tracking-tight mb-5">
              {editingProject ? 'Edit Project' : 'Create New Project'}
            </h2>

            <form onSubmit={handleSaveProject} className="space-y-4 text-xs font-mono-hl">
              <div>
                <label htmlFor="project-modal-title" className="block uppercase text-[10px] text-[#111110]/70 mb-1">
                  Project Title *
                </label>
                <input
                  id="project-modal-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Porsche 911 GT3 Editorial"
                  className="w-full rounded-xl bg-[#faf9f5] border border-[#111110]/15 px-3.5 py-2.5 text-sm text-[#111110] focus:bg-white focus:border-[#14bfb9] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="project-modal-category" className="block uppercase text-[10px] text-[#111110]/70 mb-1">
                    Category *
                  </label>
                  <select
                    id="project-modal-category"
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full rounded-xl bg-[#faf9f5] border border-[#111110]/15 px-3.5 py-2.5 text-xs text-[#111110] focus:bg-white focus:border-[#14bfb9] focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="project-modal-year" className="block uppercase text-[10px] text-[#111110]/70 mb-1">
                    Release Year *
                  </label>
                  <input
                    id="project-modal-year"
                    type="number"
                    required
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full rounded-xl bg-[#faf9f5] border border-[#111110]/15 px-3.5 py-2.5 text-xs text-[#111110] focus:bg-white focus:border-[#14bfb9] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="project-modal-client" className="block uppercase text-[10px] text-[#111110]/70 mb-1">
                    Client Name
                  </label>
                  <input
                    id="project-modal-client"
                    type="text"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    placeholder="e.g. Porsche AG"
                    className="w-full rounded-xl bg-[#faf9f5] border border-[#111110]/15 px-3.5 py-2.5 text-xs text-[#111110] focus:bg-white focus:border-[#14bfb9] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="project-modal-slug" className="block uppercase text-[10px] text-[#111110]/70 mb-1">
                    Custom Slug (Optional)
                  </label>
                  <input
                    id="project-modal-slug"
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="leave blank to auto-generate"
                    className="w-full rounded-xl bg-[#faf9f5] border border-[#111110]/15 px-3.5 py-2.5 text-xs text-[#111110] focus:bg-white focus:border-[#14bfb9] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="project-modal-cover-image" className="block uppercase text-[10px] text-[#111110]/70 mb-1">
                  Cover Image URL
                </label>
                <input
                  id="project-modal-cover-image"
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://... image url"
                  className="w-full rounded-xl bg-[#faf9f5] border border-[#111110]/15 px-3.5 py-2.5 text-xs text-[#111110] focus:bg-white focus:border-[#14bfb9] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="project-modal-description" className="block uppercase text-[10px] text-[#111110]/70 mb-1">
                  Project Description
                </label>
                <textarea
                  id="project-modal-description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Cinematic overview, creative approach, and production notes..."
                  className="w-full rounded-xl bg-[#faf9f5] border border-[#111110]/15 px-3.5 py-2.5 text-xs text-[#111110] focus:bg-white focus:border-[#14bfb9] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="rounded border-[#111110]/20 text-[#14bfb9] focus:ring-[#14bfb9]"
                  />
                  <span>Published on Live Site</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-[#111110]/20 text-[#14bfb9] focus:ring-[#14bfb9]"
                  />
                  <span>Active Status</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-[#111110]/10">
                <button
                  type="button"
                  onClick={() => setProjectModalOpen(false)}
                  className="rounded-xl border border-[#111110]/15 px-4 py-2.5 text-xs text-[#111110]/70 hover:bg-[#f4f3ee] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProject}
                  className="rounded-xl bg-[#111110] px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-[#2cf5ef] hover:bg-black transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSavingProject ? 'Saving...' : editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD / EDIT MEDIA */}
      {/* ============================================================== */}
      {mediaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-[#111110]/15 bg-white p-7 sm:p-8 shadow-2xl relative my-8 text-[#111110]">
            <button
              type="button"
              onClick={() => setMediaModalOpen(false)}
              className="absolute top-6 right-6 text-[#111110]/65 hover:text-[#111110] transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="font-display text-xl uppercase tracking-tight mb-5">
              Add Project Media
            </h2>

            <form onSubmit={handleSaveMedia} className="space-y-4 text-xs font-mono-hl">
              <div>
                <label htmlFor="media-modal-target-project" className="block uppercase text-[10px] text-[#111110]/70 mb-1">
                  Target Project *
                </label>
                <select
                  id="media-modal-target-project"
                  required
                  value={selectedProjectForMedia || projects[0]?.id || ''}
                  onChange={(e) => setSelectedProjectForMedia(e.target.value)}
                  className="w-full rounded-xl bg-[#faf9f5] border border-[#111110]/15 px-3.5 py-2.5 text-xs text-[#111110] focus:bg-white focus:border-[#14bfb9] focus:outline-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block uppercase text-[10px] text-[#111110]/70 mb-1">
                  Media Type *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="media_type"
                      value="image"
                      checked={mediaType === 'image'}
                      onChange={() => setMediaType('image')}
                    />
                    <span>Image / Still</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="media_type"
                      value="video"
                      checked={mediaType === 'video'}
                      onChange={() => setMediaType('video')}
                    />
                    <span>Video / Film</span>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="media-modal-media-url" className="block uppercase text-[10px] text-[#111110]/70 mb-1">
                  Media URL (Direct video or image URL) *
                </label>
                <input
                  id="media-modal-media-url"
                  type="url"
                  required
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://... mp4 or image url"
                  className="w-full rounded-xl bg-[#faf9f5] border border-[#111110]/15 px-3.5 py-2.5 text-xs text-[#111110] focus:bg-white focus:border-[#14bfb9] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="media-modal-poster-url" className="block uppercase text-[10px] text-[#111110]/70 mb-1">
                  Poster URL (Optional thumbnail for video)
                </label>
                <input
                  id="media-modal-poster-url"
                  type="url"
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  placeholder="https://... poster image url"
                  className="w-full rounded-xl bg-[#faf9f5] border border-[#111110]/15 px-3.5 py-2.5 text-xs text-[#111110] focus:bg-white focus:border-[#14bfb9] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="media-modal-caption" className="block uppercase text-[10px] text-[#111110]/70 mb-1">
                  Caption / Title
                </label>
                <input
                  id="media-modal-caption"
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Production still caption"
                  className="w-full rounded-xl bg-[#faf9f5] border border-[#111110]/15 px-3.5 py-2.5 text-xs text-[#111110] focus:bg-white focus:border-[#14bfb9] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-[#111110]/10">
                <button
                  type="button"
                  onClick={() => setMediaModalOpen(false)}
                  className="rounded-xl border border-[#111110]/15 px-4 py-2.5 text-xs text-[#111110]/70 hover:bg-[#f4f3ee] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingMedia}
                  className="rounded-xl bg-[#111110] px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-[#2cf5ef] hover:bg-black transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSavingMedia ? 'Saving...' : 'Add Media'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
