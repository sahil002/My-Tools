import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';
import { getGuideBySlug } from './data/guides';

export function render(url: string) {
  const path = url.split('?')[0] || '/';
  const segments = path.split('/').filter(Boolean);
  const initialGuide = segments[0] === 'guides' && segments.length === 2
    ? getGuideBySlug(decodeURIComponent(segments[1]))
    : undefined;
  const html = renderToString(<App initialPath={path} initialGuide={initialGuide} />);
  return { html };
}
