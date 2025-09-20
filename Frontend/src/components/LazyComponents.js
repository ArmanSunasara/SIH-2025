import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { HelmetProvider } from 'react-helmet-async';

// Lazy load components for code splitting
const Home = React.lazy(() => import('../pages/Home'));
const Login = React.lazy(() => import('../pages/Login'));
const Register = React.lazy(() => import('../pages/Register'));
const Predict = React.lazy(() => import('../pages/Predict'));
const History = React.lazy(() => import('../pages/History'));

// Loading fallback component
const LoadingSpinner = () => (
  <div className="loading-container">
    <div className="loading-spinner">
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  </div>
);

// Error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="error-container">
    <h2>Something went wrong</h2>
    <details style={{ whiteSpace: 'pre-wrap' }}>
      <summary>Error details</summary>
      {error.message}
    </details>
    <button onClick={resetErrorBoundary}>Try again</button>
  </div>
);

// HOC for lazy loading with error boundary
const withLazyLoading = (Component, displayName) => {
  const LazyComponent = React.forwardRef((props, ref) => (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      <Suspense fallback={<LoadingSpinner />}>
        <Component {...props} ref={ref} />
      </Suspense>
    </ErrorBoundary>
  ));
  
  LazyComponent.displayName = displayName;
  return LazyComponent;
};

// Enhanced lazy components with error boundaries
export const LazyHome = withLazyLoading(Home, 'LazyHome');
export const LazyLogin = withLazyLoading(Login, 'LazyLogin');
export const LazyRegister = withLazyLoading(Register, 'LazyRegister');
export const LazyPredict = withLazyLoading(Predict, 'LazyPredict');
export const LazyHistory = withLazyLoading(History, 'LazyHistory');

// App wrapper with providers
export const AppWrapper = ({ children }) => (
  <HelmetProvider>
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      {children}
    </ErrorBoundary>
  </HelmetProvider>
);

export { LoadingSpinner, ErrorFallback };
export default {
  LazyHome,
  LazyLogin,
  LazyRegister,
  LazyPredict,
  LazyHistory,
  AppWrapper,
  LoadingSpinner,
  ErrorFallback
};