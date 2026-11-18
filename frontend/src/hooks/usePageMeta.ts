import { useEffect } from 'react';

export const DEFAULT_TITLE = 'Hectic Lab — Independent Video Production';

export const DEFAULT_DESCRIPTION =
  'Hectic Lab is an independent video production studio crafting visual stories across automobile, documentary, fashion, restaurant, retail, and experimental film.';

export interface PageMeta {
  title: string;
  description?: string;
  image?: string | null;
}

function upsertMeta(
  attribute: 'name' | 'property',
  key: string,
  content: string,
): void {
  let tag = document.head.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${key}"]`,
  );

  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }

  tag.setAttribute('content', content);
}

function upsertCanonical(href: string): void {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }

  link.setAttribute('href', href);
}

/**
 * Keeps the document title and the social/SEO meta tags in sync with the
 * active route. Replaces the global tags declared in `index.html` per page.
 */
export function usePageMeta({ title, description, image }: PageMeta): void {
  useEffect(() => {
    const summary = description ?? DEFAULT_DESCRIPTION;
    const canonical = `${window.location.origin}${window.location.pathname}`;

    document.title = title;
    upsertMeta('name', 'description', summary);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', summary);
    upsertMeta('property', 'og:url', canonical);
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', summary);

    if (image) {
      upsertMeta('property', 'og:image', image);
      upsertMeta('name', 'twitter:image', image);
    }

    upsertCanonical(canonical);
  }, [title, description, image]);
}
