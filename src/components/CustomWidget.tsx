
interface CustomWidgetProps {
  session?: string;
  accountId?: string;
  width?: number;
  height?: number;
}

const CustomWidget = ({ session, accountId, width = 300, height = 200 }: CustomWidgetProps) => {
  console.log("CustomWidget props:", { session, accountId, width, height });
  
  if (!session || !accountId) {
    console.log("Missing required props:", { session, accountId });
    return null;
  }

  const widgetUrl = `https://widgets.myfxbook.com/api/get-custom-widget.png?session=${session}&id=${accountId}&width=${width}&height=${height}&bart=1&linet=0&bgColor=000000&gridColor=BDBDBD&lineColor=00CB05&barColor=FF8D0A&fontColor=FFFFFF&titles=20&chartbgc=474747`;
  
  console.log("Widget URL:", widgetUrl);

  return (
    <div className="tradehub-card w-full h-full min-h-[200px] overflow-hidden bg-darkBlue/40 !rounded-none shadow-[inset_0px_2px_4px_rgba(255,255,255,0.1),inset_0px_-2px_4px_rgba(0,0,0,0.2)]">
      <img 
        src={widgetUrl} 
        alt="MyFxBook Custom Widget"
        className="w-full h-full object-contain"
        onError={(e) => {
          console.error("Failed to load widget image");
          e.currentTarget.style.display = 'none';
          const parent = e.currentTarget.parentElement;
          if (parent) {
            const errorMessage = document.createElement('div');
            errorMessage.className = 'absolute inset-0 flex items-center justify-center text-white text-center p-4';
            errorMessage.innerHTML = 'Widget loading blocked. Please disable your ad blocker or check security settings to view the widget.';
            parent.appendChild(errorMessage);
          }
        }}
      />
    </div>
  );
};

export default CustomWidget;
