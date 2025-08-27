
import { Card } from "@/components/ui/card";
import { CalendarDays, ArrowLeftRight, LineChart, Radio, Newspaper, Key } from "lucide-react";
import { useNavigate } from "react-router-dom";

const tools = [
  {
    icon: <CalendarDays className="h-5 w-5" />,
    title: "Economic Calendar",
    description: "View upcoming economic events",
    externalLink: "https://www.myfxbook.com/forex-economic-calendar"
  },
  {
    icon: <ArrowLeftRight className="h-5 w-5" />,
    title: "Currency Correlations",
    description: "Analyze currency pair correlations",
    externalLink: "https://www.myfxbook.com/forex-market/correlation"
  },
  {
    icon: <LineChart className="h-5 w-5" />,
    title: "TradingView",
    description: "Advanced charting platform",
    externalLink: "https://www.tradingview.com/chart"
  },
  {
    icon: <Radio className="h-5 w-5" />,
    title: "Watch Live News",
    description: "Stay updated with live market news",
    externalLink: "https://www.youtube.com/channel/UC4R8DWoMoI7CAwX8_LjQHig"
  },
  {
    icon: <Newspaper className="h-5 w-5" />,
    title: "Read News",
    description: "Latest forex market news",
    externalLink: "https://www.forexfactory.com/calendar"
  },
  {
    icon: <Key className="h-5 w-5" />,
    title: "License Key",
    description: "Manage your EA license key",
    internalLink: "/license-key"
  }
];

const ToolsBar = () => {
  const navigate = useNavigate();
  
  const handleCardClick = (tool: typeof tools[0]) => {
    if (tool.internalLink) {
      navigate(tool.internalLink);
    } else if (tool.externalLink) {
      window.open(tool.externalLink, '_blank', 'noopener,noreferrer');
    }
  };
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {tools.map((tool, index) => (
        <Card
          key={index}
          className="!rounded-none bg-darkBlue/40 border-[#1D1D1D] backdrop-blur-sm p-3 cursor-pointer hover:bg-darkBlue/60 transition-colors shadow-lg hover:shadow-xl"
          onClick={() => handleCardClick(tool)}
        >
          <div className="flex flex-col items-center text-center gap-1 sm:gap-2">
            <div className="text-softWhite">{tool.icon}</div>
            <h3 className="text-sm font-semibold text-softWhite">{tool.title}</h3>
            <p className="text-xs text-mediumGray hidden sm:block">{tool.description}</p>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ToolsBar;
