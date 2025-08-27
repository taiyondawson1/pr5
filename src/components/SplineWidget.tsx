import React from "react";

interface SplineWidgetProps {
  className?: string;
}

const SplineWidget: React.FC<SplineWidgetProps> = ({ className }) => {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

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
      {/* Spline iframe */}
      <iframe 
        ref={iframeRef}
        src='https://my.spline.design/robotfollowcursorforlandingpagemc-QUixIp5tm34cMn1Cgz4U74W9/' 
        frameBorder='0' 
        width='100%' 
        height='100%'
        className="absolute inset-0 w-full h-full"
        style={{
          border: 'none',
          outline: 'none',
          width: '100%',
          height: '100%',
          pointerEvents: 'auto',
          userSelect: 'none'
        }}
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
