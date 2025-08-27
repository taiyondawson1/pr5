import React, { useEffect, useRef } from "react";

// Declare the global type
declare global {
  interface Window {
    fxMarketHours: () => void;
  }
}

const MarketHours = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("MarketHours mounting...");
    
    // Create script element for Myfxbook widget
    const script = document.createElement('script');
    script.src = 'https://widgets.myfxbook.com/scripts/fxMarketHours.js';
    script.async = true;
    script.onload = () => {
      console.log("Myfxbook script loaded");
      if (window.fxMarketHours) {
        window.fxMarketHours();
        console.log("Myfxbook widget initialized");
      } else {
        console.error("fxMarketHours function not found");
      }
    };
    script.onerror = (error) => {
      console.error("Error loading Myfxbook script:", error);
    };

    // Add script to document
    document.body.appendChild(script);

    return () => {
      // Cleanup script on component unmount
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div ref={containerRef} className="chart-container w-full">
      <div className="flex flex-col gap-2">
        <div className="w-full h-[400px]" id="MarketHoursWidget">
          {/* The widget will be injected here by the Myfxbook script */}
        </div>
        <div className="text-center text-sm text-lightGrey font-['Roboto',sans-serif]">
          <a 
            href="https://www.myfxbook.com/market-hours" 
            title="Forex Market Hours" 
            className="hover:text-neonBlue transition-colors"
            target="_blank" 
            rel="noopener noreferrer"
          >
            <b>Market Hours</b>
          </a>
          {" "}by Myfxbook.com
        </div>
      </div>
    </div>
  );
};

export default MarketHours;