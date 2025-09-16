import React, { Suspense, lazy } from 'react';

// Lazy load the SplineWidget component
const SplineWidget = lazy(() => import('./SplineWidget'));

interface LazySplineWidgetProps {
  className?: string;
}

const LazySplineWidget: React.FC<LazySplineWidgetProps> = ({ className }) => {
  return (
    <Suspense 
      fallback={
        <div className={`relative w-full h-full ${className}`}>
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-900/20 to-blue-900/20 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
              <p className="text-white/70 text-sm">Initializing 3D Experience...</p>
            </div>
          </div>
        </div>
      }
    >
      <SplineWidget className={className} />
    </Suspense>
  );
};

export default LazySplineWidget;
