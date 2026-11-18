import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getMediaSource,
  getProjectCategoryName,
  getProjectCategorySlug,
  getProjectThumbnail,
  getProjectVideo,
  hecticApi,
  isMediaVideo,
} from '../api/hecticApi';
import type { Project, ProjectMedia, StudioInfo } from '../api/types';
import { CyanFooter } from '../components/CyanFooter';
import { InquiryCta } from '../components/InquiryCta';
import { Navbar } from '../components/Navbar';
import { PageShell } from '../components/PageShell';
import { EmptyState, ErrorState } from '../components/StatusStates';
import { usePageMeta } from '../hooks/usePageMeta';

export function ProjectDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [media, setMedia] = useState<ProjectMedia[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studio, setStudio] = useState<StudioInfo | null>(null);
  const [isVideoPortrait, setIsVideoPortrait] = useState(false);

  const categoryName = project ? getProjectCategoryName(project) : '';
  const categorySlug = project ? getProjectCategorySlug(project) : null;
  const primaryVideo =
    (project && getProjectVideo(project)) ||
    (() => {
      const firstVid = media.find((m) => isMediaVideo(m));
      return firstVid ? getMediaSource(firstVid) : null;
    })();
  const primaryThumb = project ? getProjectThumbnail(project) : null;

  useEffect(() => {
    if (primaryVideo && (primaryVideo.includes('reel') || primaryVideo.includes('vertical'))) {
      setIsVideoPortrait(true);
    }
  }, [primaryVideo]);

  const loadProject = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const [projData, mediaData, listData] = await Promise.all([
        hecticApi.getProjectBySlug(slug),
        hecticApi.getProjectMedia(slug, { page: 1 }).catch(() => ({
          count: 0,
          next: null,
          previous: null,
          results: [],
        })),
        hecticApi.getProjects({ page: 1 }).catch(() => ({
          count: 0,
          next: null,
          previous: null,
          results: [],
        })),
      ]);

      setProject(projData);
      setMedia(mediaData.results);
      setAllProjects(listData.results);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load project details.'
      );
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadProject();
    window.scrollTo({ top: 0 });
  }, [loadProject]);

  useEffect(() => {
    hecticApi
      .getStudioInfo({ page: 1 })
      .then((res) => setStudio(res.results[0] ?? null))
      .catch(() => {});
  }, []);

  const projectYear = project?.year ?? project?.release_year;
  const projectClient = project?.client ?? project?.client_name;
  const projectDesc = project?.description ?? project?.summary;

  usePageMeta({
    title: project ? `${project.title} — Hectic Lab` : 'Project — Hectic Lab',
    description: projectDesc || undefined,
    image: project ? getProjectThumbnail(project) : null,
  });

  // Determine previous / next projects either from serializer fields or paginated project list
  const currentIdx = allProjects.findIndex((p) => p.slug === slug);
  const prevProject =
    project?.previous_project ||
    (currentIdx > 0 ? allProjects[currentIdx - 1] : null);
  const nextProject =
    project?.next_project ||
    (currentIdx >= 0 && currentIdx < allProjects.length - 1
      ? allProjects[currentIdx + 1]
      : null);

  // Determine related projects from serializer or matching category
  const relatedProjects =
    project?.related_projects && project.related_projects.length > 0
      ? project.related_projects
      : allProjects
          .filter((p) => {
            if (p.slug === slug) return false;
            if (!categorySlug) return true;
            return getProjectCategorySlug(p) === categorySlug;
          })
          .slice(0, 4);

  return (
    <div className="min-h-screen bg-[#F3F0E9] text-[#111110]">
      <Navbar />

      <PageShell>
        {loading ? (
          <div className="space-y-8" aria-label="Loading project">
            <div className="space-y-3">
              <div className="h-14 w-72 animate-pulse bg-[#e8e7e1]" />
              <div className="h-4 w-44 animate-pulse bg-[#e8e7e1]" />
            </div>
            <div className="aspect-video w-full animate-pulse bg-[#e8e7e1]" />
            <div className="flex justify-between">
              <div className="h-6 w-48 animate-pulse bg-[#e8e7e1]" />
              <div className="h-6 w-16 animate-pulse bg-[#e8e7e1]" />
            </div>
            <div className="h-16 w-2/3 animate-pulse bg-[#e8e7e1]" />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={loadProject} />
        ) : !project ? (
          <EmptyState
            title="Project not found"
            description="This project may have been moved or unpublished."
            action={
              <Link
                to="/work"
                className="rounded-full border border-[#111110]/40 px-6 py-2.5 text-xs font-normal hover:bg-[#111110] hover:text-[#F3F0E9] transition-colors"
              >
                Browse all work
              </Link>
            }
          />
        ) : (
          <>
            {/* Top Category Header matching Screenshot 4 */}
            <div className="mb-10 md:mb-12">
              {categorySlug ? (
                <Link
                  to={`/categories/${categorySlug}`}
                  className="font-mono-hl mb-3 inline-block text-xs text-[#111110]/60 hover:text-[#111110] underline underline-offset-4"
                >
                  ← {categoryName}
                </Link>
              ) : (
                <Link
                  to="/work"
                  className="font-mono-hl mb-3 inline-block text-xs text-[#111110]/60 hover:text-[#111110] underline underline-offset-4"
                >
                  ← work
                </Link>
              )}

              <h1 className="font-display text-[clamp(44px,6vw,88px)] font-normal uppercase leading-[0.94] tracking-[-0.045em]">
                {categoryName}
              </h1>
              <p className="mt-2 text-xs text-[#111110]/75 md:text-[13px]">
                see through our collection.
              </p>
            </div>

            {/* Large Video Presentation */}
            <div className={`relative w-full overflow-hidden bg-[#18181b] flex items-center justify-center transition-all duration-500 ${
              isVideoPortrait ? 'aspect-[9/16] max-w-[500px] mx-auto rounded-[6px] shadow-2xl' : 'aspect-video'
            }`}>
              {primaryVideo ? (
                <video
                  src={primaryVideo}
                  poster={primaryThumb ?? undefined}
                  controls
                  playsInline
                  preload="metadata"
                  onLoadedMetadata={(e) => {
                    const v = e.currentTarget;
                    if (v.videoWidth && v.videoHeight) {
                      setIsVideoPortrait(v.videoWidth < v.videoHeight);
                    }
                  }}
                  className={`h-full w-full bg-[#060607] ${isVideoPortrait ? 'object-contain' : 'object-cover'}`}
                />
              ) : primaryThumb ? (
                <img
                  src={primaryThumb}
                  alt={project.title}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#18181b] p-8 text-center">
                  <p className="font-display text-xl uppercase tracking-tight text-[#f3f2ee]/60">
                    {project.title}
                  </p>
                </div>
              )}
            </div>

            {/* Title + Year Metadata Row */}
            <div className="mt-6 flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="font-display text-lg font-normal uppercase tracking-tight md:text-xl">
                <span className="font-mono-hl text-[#14bfb9]">( 1 )</span>{' '}
                {project.title}
              </h2>
              {projectYear ? (
                <span className="font-mono-hl text-sm text-[#111110]/75">
                  {projectYear}
                </span>
              ) : null}
            </div>

            {/* Description & Client Details */}
            <div className="mt-10 max-w-4xl space-y-8 text-[15px] leading-[1.6] text-[#111110]/85">
              {projectDesc ? (
                <p>
                  <span className="font-medium text-[#111110]">Description :</span> {projectDesc}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-x-10 gap-y-2 text-[14px]">
                {projectClient ? (
                  <p>
                    <span className="font-medium text-[#111110]">Client :</span> {projectClient}
                  </p>
                ) : null}
                {categoryName ? (
                  <p>
                    <span className="font-medium text-[#111110]">Category :</span>{' '}
                    {categorySlug ? (
                      <Link
                        to={`/categories/${categorySlug}`}
                        className="underline underline-offset-4 hover:opacity-70 text-[#111110]"
                      >
                        {categoryName}
                      </Link>
                    ) : (
                      categoryName
                    )}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Additional Project Media from /projects/<slug>/media/ */}
            {media.length > 0 ? (
              <section className="mt-16 border-t border-[#111110]/15 pt-12">
                <h3 className="font-display text-2xl font-normal uppercase tracking-tight mb-8">
                  Project Media
                </h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {media.map((item) => {
                    const src = getMediaSource(item);
                    if (!src) return null;
                    const isVid = isMediaVideo(item);
                    return (
                      <figure key={item.id} className="space-y-2">
                        <div className="aspect-[16/10] w-full overflow-hidden bg-[#e8e7e1]">
                          {isVid ? (
                            <video
                              src={src}
                              controls
                              playsInline
                              preload="metadata"
                              className="h-full w-full object-cover bg-[#060607]"
                            />
                          ) : (
                            <img
                              src={src}
                              alt={item.caption || item.title || project.title}
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        {item.caption || item.title ? (
                          <figcaption className="font-mono-hl text-xs text-[#111110]/65">
                            {item.caption || item.title}
                          </figcaption>
                        ) : null}
                      </figure>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {/* Previous / Next Project Navigation */}
            {prevProject || nextProject ? (
              <nav
                aria-label="Project navigation"
                className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-[#111110]/15 pt-8"
              >
                <div>
                  {prevProject ? (
                    <Link
                      to={`/projects/${prevProject.slug}`}
                      className="group inline-flex flex-col text-left"
                    >
                      <span className="font-mono-hl text-[11px] uppercase text-[#111110]/65">
                        ← Previous project
                      </span>
                      <span className="mt-1 font-display text-lg uppercase tracking-tight group-hover:underline underline-offset-4">
                        {prevProject.title}
                      </span>
                    </Link>
                  ) : null}
                </div>

                <div className="text-right">
                  {nextProject ? (
                    <Link
                      to={`/projects/${nextProject.slug}`}
                      className="group inline-flex flex-col text-right"
                    >
                      <span className="font-mono-hl text-[11px] uppercase text-[#111110]/65">
                        Next project →
                      </span>
                      <span className="mt-1 font-display text-lg uppercase tracking-tight group-hover:underline underline-offset-4">
                        {nextProject.title}
                      </span>
                    </Link>
                  ) : null}
                </div>
              </nav>
            ) : null}

            {/* Related Projects */}
            {relatedProjects.length > 0 ? (
              <section className="mt-16 border-t border-[#111110]/15 pt-12">
                <h3 className="font-display text-2xl font-normal uppercase tracking-tight mb-8">
                  Related Projects
                </h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {relatedProjects.map((rel, idx) => {
                    const thumb = getProjectThumbnail(rel);
                    return (
                      <Link
                        key={rel.id}
                        to={`/projects/${rel.slug}`}
                        className="group block"
                      >
                        <div className="aspect-[4/5] w-full overflow-hidden bg-[#e8e7e1]">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={rel.title}
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="flex h-full w-full items-end p-4">
                              <span className="font-display text-sm uppercase text-[#111110]/60">
                                {rel.title}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="mt-3 font-display text-sm uppercase tracking-tight truncate">
                          <span className="font-mono-hl text-[#14bfb9]">
                            ( {idx + 1} )
                          </span>{' '}
                          {rel.title}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </>
        )}
      </PageShell>

      <InquiryCta variant="dark" />
      <CyanFooter studio={studio} />
    </div>
  );
}
