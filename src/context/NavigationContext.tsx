import React, { createContext, useContext, useState, useEffect } from 'react';

interface NavigationContextType {
  pathname: string;
  navigate: (to: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

const normalizePath = (path: string): string => {
  const clean = path.split('?')[0].split('#')[0].trim().toLowerCase();
  if (clean === '' || clean === '/' || clean === '/login' || clean === '/student') {
    return '/';
  }
  if (clean.startsWith('/assistant')) {
    return '/assistant';
  }
  if (clean.startsWith('/admin')) {
    return '/admin';
  }
  return '/';
};

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pathname, setPathname] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return normalizePath(window.location.pathname);
    }
    return '/';
  });

  useEffect(() => {
    const handleLocationChange = () => {
      setPathname(normalizePath(window.location.pathname));
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigate = (to: string) => {
    const target = normalizePath(to);
    if (window.location.pathname !== target) {
      window.history.pushState(null, '', target);
      setPathname(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <NavigationContext.Provider value={{ pathname, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
