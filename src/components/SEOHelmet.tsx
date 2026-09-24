import { useEffect } from 'react';
import { getSiteUrl } from '../data/siteConfig';
import { BreadcrumbItem } from '../types';

interface SEOProps {
  title: string;
  description: string;
  canonicalPath?: string;
  ogType?: 'website' | 'article';
  schema?: Record<string, unknown> | Array<Record<string, unknown>>;
  breadcrumbs?: BreadcrumbItem[];
  noindex?: boolean;
}

/**
 * Generates structured Schema.org BreadcrumbList object
 */
function buildBreadcrumbSchema(items: BreadcrumbItem[], baseUrl: string): Record<string, unknown> {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
  const allItems: BreadcrumbItem[] = items.length > 0 && items[0].path === '/'
    ? items
    : [{ label: 'Home', path: '/' }, ...items];

  return {
    '@type': 'BreadcrumbList',
    itemListElement: allItems.map((item, index) => {
      const isHome = item.path === '/' || item.path === '';
      const fullUrl = item.path
        ? isHome
          ? normalizedBaseUrl
          : `${normalizedBaseUrl}${item.path.startsWith('/') ? item.path : `/${item.path}`}`
        : undefined;

      const element: Record<string, unknown> = {
        '@type': 'ListItem',
        position: index + 1,
        name: item.label,
      };

      if (fullUrl) {
        element.item = fullUrl;
      }

      return element;
    }),
  };
}

export function SEOHelmet({
  title,
  description,
  canonicalPath = '',
  ogType = 'website',
  schema,
  breadcrumbs,
  noindex = false,
}: SEOProps) {
  useEffect(() => {
    // 1. Page Title
    const formattedTitle = title.includes('Online Tools')
      ? title
      : `${title} | Online Tools`;
    document.title = formattedTitle;

    // 2. Robots meta (for private admin / non-indexed pages)
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (noindex) {
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.setAttribute('name', 'robots');
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.setAttribute('content', 'noindex, nofollow');
    } else if (robotsMeta) {
      robotsMeta.remove();
    }

    // 3. Meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // 4. OpenGraph Tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', formattedTitle);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', description);

    let ogTypeTag = document.querySelector('meta[property="og:type"]');
    if (!ogTypeTag) {
      ogTypeTag = document.createElement('meta');
      ogTypeTag.setAttribute('property', 'og:type');
      document.head.appendChild(ogTypeTag);
    }
    ogTypeTag.setAttribute('content', ogType);

    let ogSiteName = document.querySelector('meta[property="og:site_name"]');
    if (!ogSiteName) {
      ogSiteName = document.createElement('meta');
      ogSiteName.setAttribute('property', 'og:site_name');
      document.head.appendChild(ogSiteName);
    }
    ogSiteName.setAttribute('content', 'Online Tools');

    // 5. Twitter Card Tags
    let twitterCard = document.querySelector('meta[name="twitter:card"]');
    if (!twitterCard) {
      twitterCard = document.createElement('meta');
      twitterCard.setAttribute('name', 'twitter:card');
      document.head.appendChild(twitterCard);
    }
    twitterCard.setAttribute('content', 'summary_large_image');

    let twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (!twitterTitle) {
      twitterTitle = document.createElement('meta');
      twitterTitle.setAttribute('name', 'twitter:title');
      document.head.appendChild(twitterTitle);
    }
    twitterTitle.setAttribute('content', formattedTitle);

    let twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (!twitterDesc) {
      twitterDesc = document.createElement('meta');
      twitterDesc.setAttribute('name', 'twitter:description');
      document.head.appendChild(twitterDesc);
    }
    twitterDesc.setAttribute('content', description);

    // 6. Canonical URL & OpenGraph URL
    const baseUrl = getSiteUrl().replace(/\/+$/, '');
    const cleanRelativePath = canonicalPath || (typeof window !== 'undefined' ? window.location.pathname : '');
    const canonicalUrl = cleanRelativePath === '/' || cleanRelativePath === ''
      ? baseUrl
      : `${baseUrl}${cleanRelativePath.startsWith('/') ? cleanRelativePath : `/${cleanRelativePath}`}`;

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', canonicalUrl);

    // 7. Schema.org JSON-LD structured data (including BreadcrumbList on all pages)
    if (!noindex) {
      // Assemble breadcrumbs items
      let effectiveBreadcrumbs: BreadcrumbItem[] = breadcrumbs || [];
      if (effectiveBreadcrumbs.length === 0) {
        if (cleanRelativePath === '/' || cleanRelativePath === '') {
          effectiveBreadcrumbs = [{ label: 'Home', path: '/' }];
        } else {
          // Derive breadcrumb path segments from canonicalPath
          const segments = cleanRelativePath.split('/').filter(Boolean);
          let accumulatedPath = '';
          effectiveBreadcrumbs = [
            { label: 'Home', path: '/' },
            ...segments.map((seg, idx) => {
              accumulatedPath += `/${seg}`;
              const formattedLabel = seg
                .split('-')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
              return {
                label: idx === segments.length - 1 ? (title.split('–')[0].trim() || formattedLabel) : formattedLabel,
                path: accumulatedPath,
              };
            }),
          ];
        }
      }

      const breadcrumbSchema = buildBreadcrumbSchema(effectiveBreadcrumbs, baseUrl);

      // Collect all page schemas
      const schemasList: Record<string, unknown>[] = [];
      if (schema) {
        if (Array.isArray(schema)) {
          schemasList.push(...schema);
        } else {
          schemasList.push(schema);
        }
      }

      // Check if schema already has a BreadcrumbList
      const hasBreadcrumbList = schemasList.some((s) => s['@type'] === 'BreadcrumbList');
      if (!hasBreadcrumbList) {
        schemasList.push(breadcrumbSchema);
      }

      // Clean individual @context when packaging into @graph
      const cleanGraph = schemasList.map((s) => {
        const copy = { ...s };
        delete copy['@context'];
        return copy;
      });

      const structuredDataGraph = {
        '@context': 'https://schema.org',
        '@graph': cleanGraph,
      };

      let scriptTag = document.getElementById('seo-structured-data') as HTMLScriptElement | null;
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'seo-structured-data';
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.text = JSON.stringify(structuredDataGraph);
    } else {
      // Remove structured data for non-indexed/admin pages
      const scriptTag = document.getElementById('seo-structured-data');
      if (scriptTag) scriptTag.remove();
    }

    return () => {
      // Optional cleanup on unmount
    };
  }, [title, description, canonicalPath, ogType, schema, breadcrumbs, noindex]);

  return null;
}
