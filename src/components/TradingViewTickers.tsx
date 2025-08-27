import { useEffect, useRef } from "react";

const TradingViewTickers = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-tickers.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        {
          description: "",
          proName: "PYTH:XAUUSD"
        },
        {
          description: "",
          proName: "BITSTAMP:BTCUSD"
        },
        {
          description: "",
          proName: "BLACKBULL:US30"
        },
        {
          description: "",
          proName: "FX:EURUSD"
        }
      ],
      isTransparent: true,
      showSymbolLogo: true,
      colorTheme: "dark",
      locale: "en"
    });

    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }

    return () => {
      if (containerRef.current) {
        const scriptElement = containerRef.current.querySelector("script");
        if (scriptElement) {
          scriptElement.remove();
        }
      }
    };
  }, []);

  return (
    <div className="tradingview-widget-container w-full bg-darkBlue/40 p-4 border border-mediumGray/20">
      <div ref={containerRef} className="tradingview-widget-container__widget"></div>
    </div>
  );
};

export default TradingViewTickers;