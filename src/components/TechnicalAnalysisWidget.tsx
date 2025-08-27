import { useEffect, useRef } from 'react';

// Remove duplicate declaration since it's already in TradingChart.tsx
const TechnicalAnalysisWidget = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const widgetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create widget container first
    const widget = document.createElement('div');
    widgetRef.current = widget;
    widget.className = 'tradingview-widget-container__widget';
    containerRef.current.appendChild(widget);

    // Then create and add script
    const script = document.createElement('script');
    scriptRef.current = script;
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = `
      {
        "interval": "1h",
        "width": "450",
        "isTransparent": true,
        "height": "450",
        "symbol": "OANDA:XAUUSD",
        "showIntervalTabs": true,
        "displayMode": "single",
        "locale": "en",
        "colorTheme": "dark"
      }
    `;
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        // Clear the container instead of trying to remove individual nodes
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="tradingview-technical-widget min-w-[450px] min-h-[450px]">
    </div>
  );
};

export default TechnicalAnalysisWidget;