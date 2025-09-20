import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

// Performance monitoring utilities
export const performanceUtils = {
  // Measure component render time
  measureRender: (componentName) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime > 16) { // Longer than one frame at 60fps
        console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
      
      return renderTime;
    };
  },

  // Monitor Core Web Vitals
  measureWebVitals: () => {
    const vitals = {};
    
    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      vitals.LCP = lastEntry.startTime;
      console.log('LCP:', vitals.LCP);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((list) => {
      const firstInput = list.getEntries()[0];
      if (firstInput) {
        vitals.FID = firstInput.processingStart - firstInput.startTime;
        console.log('FID:', vitals.FID);
      }
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      vitals.CLS = clsValue;
      console.log('CLS:', vitals.CLS);
    }).observe({ entryTypes: ['layout-shift'] });

    return vitals;
  },

  // Bundle size analyzer
  analyzeBundle: () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Bundle analysis available in production build');
      return;
    }

    // This would integrate with webpack-bundle-analyzer
    console.log('Run "npm run analyze" to analyze bundle size');
  }
};

// Custom hooks for performance optimization
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const useThrottle = (callback, delay) => {
  const throttleRef = useRef(false);

  return useCallback((...args) => {
    if (!throttleRef.current) {
      throttleRef.current = true;
      callback(...args);
      
      setTimeout(() => {
        throttleRef.current = false;
      }, delay);
    }
  }, [callback, delay]);
};

export const useMemoizedCallback = (callback, deps) => {
  return useCallback(callback, deps);
};

export const useMemoizedValue = (factory, deps) => {
  return useMemo(factory, deps);
};

// Image lazy loading hook
export const useLazyImage = (src, placeholder) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageRef, setImageRef] = useState();

  useEffect(() => {
    let observer;
    
    if (imageRef && imageSrc === placeholder) {
      observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              observer.unobserve(imageRef);
            }
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(imageRef);
    }
    
    return () => {
      if (observer && observer.unobserve) {
        observer.unobserve(imageRef);
      }
    };
  }, [imageRef, imageSrc, placeholder, src]);

  return [setImageRef, imageSrc];
};

// Virtual scrolling utilities
export const useVirtualScroll = (items, containerHeight, itemHeight) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      style: {
        position: 'absolute',
        top: (startIndex + index) * itemHeight,
        height: itemHeight
      }
    }));
  }, [items, scrollTop, containerHeight, itemHeight]);

  const totalHeight = items.length * itemHeight;

  return {
    visibleItems,
    totalHeight,
    onScroll: (e) => setScrollTop(e.target.scrollTop)
  };
};

// Memory management utilities
export const memoryUtils = {
  // Clean up unused references
  cleanup: (refs) => {
    refs.forEach(ref => {
      if (ref.current) {
        ref.current = null;
      }
    });
  },

  // Monitor memory usage
  monitorMemory: () => {
    if ('memory' in performance) {
      const memory = performance.memory;
      console.log('Memory usage:', {
        used: `${Math.round(memory.usedJSHeapSize / 1048576)} MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1048576)} MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)} MB`
      });
    }
  },

  // Force garbage collection (only available in some browsers)
  forceGC: () => {
    if ('gc' in window) {
      window.gc();
    }
  }
};

// Code splitting utilities
export const splitUtils = {
  // Preload route component
  preloadRoute: (importFunction) => {
    if (typeof importFunction === 'function') {
      importFunction();
    }
  },

  // Preload multiple routes
  preloadRoutes: (importFunctions) => {
    importFunctions.forEach(importFunction => {
      splitUtils.preloadRoute(importFunction);
    });
  }
};

// Service worker utilities for caching
export const swUtils = {
  // Register service worker
  register: (swPath = '/sw.js') => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register(swPath)
          .then(registration => {
            console.log('SW registered: ', registration);
          })
          .catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  },

  // Update service worker
  update: () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.update();
        });
      });
    }
  },

  // Unregister service worker
  unregister: () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
        });
      });
    }
  }
};

// Initialize performance monitoring
export const initPerformance = () => {
  // Start measuring web vitals
  performanceUtils.measureWebVitals();

  // Monitor memory usage in development
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      memoryUtils.monitorMemory();
    }, 30000); // Every 30 seconds
  }

  // Register service worker in production
  if (process.env.NODE_ENV === 'production') {
    swUtils.register();
  }
};

export default {
  performanceUtils,
  useDebounce,
  useThrottle,
  useMemoizedCallback,
  useMemoizedValue,
  useLazyImage,
  useVirtualScroll,
  memoryUtils,
  splitUtils,
  swUtils,
  initPerformance
};