import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';

export function renderPublicRoute(path: string): string {
  return renderToString(React.createElement(App, { initialPath: path }));
}
