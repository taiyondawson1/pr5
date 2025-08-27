
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ExpertAdvisors = () => {
  const { toast } = useToast();

  // Mock connected account ID - replace this with actual account connection logic
  const connectedAccountId = "demo123";

  const experts = [
    {
      name: "PlatinumAi: Infinity",
      description: "Our most advanced bot. Use with caution.",
      subtitle: "Ideal for personal capital, optimized for prop firm capital.",
      presets: "5 presets available",
      path: "/expert-advisors/platinumai-infinity",
      filename: "PlatinumAi Infinity.ex4",
      downloadUrl: "https://qzbwxtegqsusmfwjauwh.supabase.co/storage/v1/object/public/expert-advisors/PlatinumAI%20Infinity%20V4.ex4"
    },
  ];

  const handleDownload = async (expert: typeof experts[0]) => {
    try {
      toast({
        title: "Starting Download",
        description: `Downloading ${expert.name}...`,
      });

      // If we have a direct download URL, use it
      if (expert.downloadUrl) {
        const link = document.createElement('a');
        link.href = expert.downloadUrl;
        link.download = expert.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Fall back to signed URL for other files
        const { data, error } = await supabase.storage
          .from('expert-advisors')
          .createSignedUrl(expert.filename, 60);

        if (error) {
          throw error;
        }

        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = expert.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast({
        title: "Download Complete",
        description: `Successfully downloaded ${expert.name}`,
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

  const handleSetupGuide = (expertName: string) => {
    toast({
      title: "Setup Guide",
      description: `Opening setup guide for ${expertName}...`,
    });
  };

  return (
    <div className="relative">
      <div className="glass-card px-4 sm:px-6 py-4 rounded-2xl mb-4 sm:mb-6 relative z-10"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        <h1 className="text-lg sm:text-xl font-semibold text-white mb-4">Expert Advisors</h1>
      </div>
      
      <Alert variant="default" className="mb-4 sm:mb-6 glass-card border-amber-500/50 relative z-10"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <AlertTitle className="text-amber-500">Important MT4 Configuration</AlertTitle>
        <AlertDescription className="text-white/70">
          Make sure to add the validation URL to MT4's allowed URLs list:
          <br />
          Tools -&gt; Options -&gt; Expert Advisors -&gt; "Allow WebRequest for listed URL"
          <br />
          Add this URL: <span className="font-mono text-xs bg-black/30 px-1 py-0.5 rounded">https://qzbwxtegqsusmfwjauwh.supabase.co/functions/v1/validate-license</span>
        </AlertDescription>
      </Alert>
      
      <div className="grid gap-3 relative">
        {/* Left fade gradient */}
        <div className="absolute left-0 top-0 w-16 h-full bg-gradient-to-r from-darkBase to-transparent z-10" />
        
        {/* Right fade gradient */}
        <div className="absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-darkBase to-transparent z-10" />
        
        {experts.map((expert) => (
          <div 
            key={expert.name}
            className="group p-3 sm:p-4 rounded-2xl relative overflow-hidden z-10"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
            }}
          >
            {/* Purple gradient reflective effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700
                          bg-gradient-to-r from-transparent via-purple-500/20 to-transparent
                          translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000
                          pointer-events-none" />
            
            <div className="flex flex-col items-center justify-center gap-3 relative">
              <div className="space-y-1.5 text-center">
                <div>
                  <h2 className="text-sm sm:text-base font-medium text-white">{expert.name}</h2>
                  <p className="text-xs sm:text-sm text-white/70 leading-relaxed">{expert.description}</p>
                  {expert.subtitle && (
                    <p className="text-xs text-white/60 mt-1 leading-relaxed">{expert.subtitle}</p>
                  )}
                </div>
                <div className="flex flex-col items-center justify-center gap-2 pt-1.5">
                  <div className="text-xs text-white/60 flex items-center mb-2">
                    <span className="inline-block mr-1">📄</span>
                    {expert.presets}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleDownload(expert)}
                      size="sm"
                      className="px-3 text-xs h-7 relative overflow-hidden group rounded-lg"
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
                    <Button
                      onClick={() => handleSetupGuide(expert.name)}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 rounded-lg"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        color: '#ffffff',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                      }}
                    >
                      Setup guide
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpertAdvisors;
