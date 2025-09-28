import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Download, FileText, Settings, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const IceFXNewsFilterContent = () => {
  const { toast } = useToast();

  const files = [
    {
      name: "IceFX.NewsInfo.ex4",
      description: "Main Expert Advisor file for MT4",
      downloadUrl: "https://qzbwxtegqsusmfwjauwh.supabase.co/storage/v1/object/public/expert-advisors/IceFX.NewsInfo.ex4",
      type: "Expert Advisor"
    },
    {
      name: "IceFX.NewsInfo.dll",
      description: "Dynamic Link Library for advanced functionality",
      downloadUrl: "https://qzbwxtegqsusmfwjauwh.supabase.co/storage/v1/object/public/expert-advisors/IceFX.NewsInfo.dll",
      type: "Library"
    },
    {
      name: "NEWS FILTER SETFILE FOR INFINITY.set",
      description: "Pre-configured settings file for PlatinumAi Infinity",
      downloadUrl: "https://qzbwxtegqsusmfwjauwh.supabase.co/storage/v1/object/public/expert-advisors/NEWS%20FILTER%20SETFILE%20FOR%20INFINITY.set",
      type: "Settings"
    }
  ];

  const handleDownload = async (file: typeof files[0]) => {
    try {
      toast({
        title: "Starting Download",
        description: `Downloading ${file.name}...`,
      });

      const link = document.createElement('a');
      link.href = file.downloadUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Complete",
        description: `Successfully downloaded ${file.name}`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const installationSteps = [
    {
      step: 1,
      title: "Download Files",
      description: "Download all three files using the buttons below",
      icon: Download
    },
    {
      step: 2,
      title: "Install Expert Advisor",
      description: "Copy IceFX.NewsInfo.ex4 to your MT4 MQL4/Experts folder",
      icon: FileText
    },
    {
      step: 3,
      title: "Install Library",
      description: "Copy IceFX.NewsInfo.dll to your MT4 MQL4/Libraries folder",
      icon: Settings
    },
    {
      step: 4,
      title: "Load Settings",
      description: "Import the .set file into your PlatinumAi Infinity EA",
      icon: CheckCircle
    }
  ];

  return (
    <div className="relative">
      {/* Header */}
      <div className="glass-card px-4 sm:px-6 py-4 rounded-2xl mb-4 sm:mb-6 relative z-10"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        <h1 className="text-lg sm:text-xl font-semibold text-white mb-2">IceFX News Filter</h1>
        <p className="text-sm text-white/70">
          Advanced news filtering system for PlatinumAi Infinity Expert Advisor
        </p>
      </div>

      {/* Important Notice */}
      <Alert variant="default" className="mb-4 sm:mb-6 glass-card border-amber-500/50 relative z-10"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <AlertTitle className="text-amber-500">Important Notice</AlertTitle>
        <AlertDescription className="text-white/70">
          This news filter is specifically designed for PlatinumAi Infinity EA. 
          Make sure you have PlatinumAi Infinity installed before using this filter.
        </AlertDescription>
      </Alert>

      {/* Installation Steps */}
      <Card className="mb-6 glass-card border-white/10 relative z-10"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Installation Guide
          </CardTitle>
          <CardDescription className="text-white/70">
            Follow these steps to properly install the IceFX News Filter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {installationSteps.map((step, index) => (
              <div key={step.step} className="flex items-start gap-4 p-4 rounded-lg"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                  {step.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <step.icon className="h-4 w-4 text-blue-400" />
                    <h3 className="text-white font-medium">{step.title}</h3>
                  </div>
                  <p className="text-white/70 text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* File Downloads */}
      <Card className="mb-6 glass-card border-white/10 relative z-10"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download Files
          </CardTitle>
          <CardDescription className="text-white/70">
            Download all required files for the IceFX News Filter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {files.map((file, index) => (
              <div key={file.name} className="group p-4 rounded-lg relative overflow-hidden"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.05)';
                }}
              >
                {/* Purple gradient reflective effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700
                              bg-gradient-to-r from-transparent via-purple-500/20 to-transparent
                              translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000
                              pointer-events-none" />
                
                <div className="flex items-center justify-between relative">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-blue-400" />
                      <h3 className="text-white font-medium text-sm">{file.name}</h3>
                      <span className="px-2 py-1 text-xs rounded-full"
                        style={{
                          background: 'rgba(59, 130, 246, 0.2)',
                          color: '#60a5fa',
                          border: '1px solid rgba(59, 130, 246, 0.3)'
                        }}
                      >
                        {file.type}
                      </span>
                    </div>
                    <p className="text-white/70 text-xs">{file.description}</p>
                  </div>
                  <Button
                    onClick={() => handleDownload(file)}
                    size="sm"
                    className="px-3 text-xs h-8 relative overflow-hidden group rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                      color: '#ffffff',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.3))';
                      e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))';
                      e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                    }}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700
                                  bg-gradient-to-r from-transparent via-purple-500/20 to-transparent
                                  translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000
                                  pointer-events-none" />
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Instructions */}
      <Card className="glass-card border-white/10 relative z-10"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Info className="h-5 w-5" />
            Configuration Instructions
          </CardTitle>
          <CardDescription className="text-white/70">
            How to configure the news filter with PlatinumAi Infinity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-white/70 text-sm">
            <div className="p-4 rounded-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              <h4 className="text-white font-medium mb-2">1. Load the Settings File</h4>
              <p>In your PlatinumAi Infinity EA settings, click "Load" and select the "NEWS FILTER SETFILE FOR INFINITY.set" file.</p>
            </div>
            
            <div className="p-4 rounded-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              <h4 className="text-white font-medium mb-2">2. Enable News Filter</h4>
              <p>Make sure the "Use News Filter" option is enabled in your EA settings. This will automatically pause trading during high-impact news events.</p>
            </div>
            
            <div className="p-4 rounded-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              <h4 className="text-white font-medium mb-2">3. Configure News Settings</h4>
              <p>Adjust the news filter parameters according to your risk tolerance. The default settings are optimized for most trading conditions.</p>
            </div>
            
            <div className="p-4 rounded-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              <h4 className="text-white font-medium mb-2">4. Test the Setup</h4>
              <p>Run the EA on a demo account first to ensure the news filter is working correctly before using it on live accounts.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const IceFXNewsFilterPage = () => {
  return (
    <>
      {/* Purple background overlay - positioned to avoid sidebar */}
      <div 
        className="absolute z-0"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
          backgroundAttachment: 'fixed',
          left: '0', // Start from the very left edge
          top: '0',
          right: '0',
          bottom: '0'
        }}
      >
        {/* Animated purple overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 animate-pulse opacity-40"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex-1 min-h-screen">
        <div className="p-4 pt-8 sm:pt-12 ml-[64px]">
          <IceFXNewsFilterContent />
        </div>
      </div>
    </>
  );
};

export default IceFXNewsFilterPage;
