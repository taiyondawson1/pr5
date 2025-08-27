import ExpertAdvisors from "@/components/ExpertAdvisors";

const ExpertAdvisorsPage = () => {
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
          <ExpertAdvisors />
        </div>
      </div>
    </>
  );
};

export default ExpertAdvisorsPage;