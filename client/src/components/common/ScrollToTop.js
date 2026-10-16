import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop ensures that whenever the user navigates to a new page/route,
 * the viewport and any potential scroll containers are reset to the top (scrollTop: 0).
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Reset browser window scroll
    if (typeof window !== 'undefined') {
      try {
        if (typeof window.scrollTo === 'function') {
          window.scrollTo(0, 0);
        }
      } catch (err) {
        // Fallback for environments lacking full window.scrollTo support
      }
    }

    // Reset document element & body scroll
    if (typeof document !== 'undefined') {
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
      }

      // Reset any application scroll containers
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        mainContent.scrollTop = 0;
      }
      const appContainer = document.querySelector('.app-container');
      if (appContainer) {
        appContainer.scrollTop = 0;
      }
    }
  }, [pathname]);

  return null;
}

export default ScrollToTop;
