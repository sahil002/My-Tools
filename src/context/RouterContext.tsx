import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface RouterContextType {
  currentPath: string;
  navigate: (path: string) => void;
}

const RouterContext = createContext<RouterContextType>({
  currentPath: '/',
  navigate: () => {},
});

function getResolvedPath(): string {
  if (typeof window === 'undefined') return '/';
  
  // 1. Check query parameter e.g. ?page=panel-access or ?route=/admin/dashboard
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const routeParam = searchParams.get('route') || searchParams.get('page');
    if (routeParam) {
      return routeParam.startsWith('/') ? routeParam : `/${routeParam}`;
    }
  } catch {
    // ignore
  }

  // 2. Check hash routing e.g. #/panel-access
  if (window.location.hash) {
    const hash = window.location.hash.replace(/^#\/?/, '/');
    if (hash && hash !== '/') {
      return hash.startsWith('/') ? hash : `/${hash}`;
    }
  }

  // 3. Standard pathname
  return window.location.pathname || '/';
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return getResolvedPath();
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(getResolvedPath());
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const navigate = (path: string) => {
    if (path === currentPath) return;
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  return (
    <RouterContext.Provider value={{ currentPath, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  return useContext(RouterContext);
}

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
}

export function Link({ href, children, className = '', activeClassName = '', ...props }: LinkProps) {
  const { currentPath, navigate } = useRouter();
  const isActive = currentPath === href || (href !== '/' && currentPath.startsWith(href));

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (props.onClick) {
      props.onClick(e);
    }
    // Only handle left clicks without modifier keys
    if (
      !e.defaultPrevented &&
      e.button === 0 &&
      !e.metaKey &&
      !e.altKey &&
      !e.ctrlKey &&
      !e.shiftKey &&
      !href.startsWith('http') &&
      !href.startsWith('mailto:')
    ) {
      e.preventDefault();
      navigate(href);
    }
  };

  const combinedClass = `${className} ${isActive && activeClassName ? activeClassName : ''}`.trim();

  return (
    <a href={href} onClick={handleClick} className={combinedClass} {...props}>
      {children}
    </a>
  );
}
