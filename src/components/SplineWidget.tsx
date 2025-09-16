import React, { useState, useCallback } from "react";

interface SplineWidgetProps {
  className?: string;
}

const SplineWidget: React.FC<SplineWidgetProps> = ({ className }) => {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  React.useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Add event listeners to the iframe
    iframe.addEventListener('mousedown', handleMouseDown, true);
    iframe.addEventListener('mouseup', handleMouseUp, true);
    iframe.addEventListener('click', handleClick, true);

    return () => {
      iframe.removeEventListener('mousedown', handleMouseDown, true);
      iframe.removeEventListener('mouseup', handleMouseUp, true);
      iframe.removeEventListener('click', handleClick, true);
    };
  }, []);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-900/20 to-blue-900/20 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
            <p className="text-white/70 text-sm">Loading 3D Experience...</p>
          </div>
        </div>
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-900/20 to-blue-900/20 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-white/70 text-sm">Failed to load 3D experience</p>
            <button 
              onClick={() => {
                setHasError(false);
                setIsLoading(true);
                if (iframeRef.current) {
                  iframeRef.current.src = iframeRef.current.src;
                }
              }}
              className="mt-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-lg text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Spline iframe */}
      <iframe 
        ref={iframeRef}
        src='https://my.spline.design/robotfollowcursorforlandingpagemc-QUixIp5tm34cMn1Cgz4U74W9/' 
        frameBorder='0' 
        width='100%' 
        height='100%'
        loading="eager"
        className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        style={{
          border: 'none',
          outline: 'none',
          width: '100%',
          height: '100%',
          pointerEvents: 'auto',
          userSelect: 'none'
        }}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
      
      {/* Overlay to hide watermark - positioned to cover the bottom right area */}
      <div 
        className="absolute bottom-0 right-0 w-40 h-12 bg-black opacity-95 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.95) 50%)',
          zIndex: 10
        }}
      />
      
      {/* Additional overlay for any other watermark areas */}
      <div 
        className="absolute top-0 right-0 w-32 h-8 bg-black opacity-95 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.95) 50%)',
          zIndex: 10
        }}
      />
      
      {/* Bottom left watermark overlay */}
      <div 
        className="absolute bottom-0 left-0 w-32 h-8 bg-black opacity-95 pointer-events-none"
        style={{
          background: 'linear-gradient(225deg, transparent 0%, rgba(0,0,0,0.95) 50%)',
          zIndex: 10
        }}
      />
    </div>
  );
};

export default SplineWidget;
