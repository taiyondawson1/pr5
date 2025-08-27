
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";

const courses = [
  {
    name: "**[START HERE] HOW TO INSTALL**",
    description: "Learn how to properly install and set up your Expert Advisor",
    externalUrl: "https://classroom.google.com/c/NzQ4Mjg0ODU3NDE4?cjc=4lz6o2f"
  },
  {
    name: "PlatinumAi: Infinity",
    description: "Learn the Infinity trading approach",
    externalUrl: "https://classroom.google.com/c/NzQ4NDY3OTY2NjU5?cjc=cz4udgo"
  }
];

const CoursesPage = () => {
  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8">
      <section 
        className="mb-6 rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Courses</h2>
          <p className="text-white/70 mt-2">Learn how to install and use your Expert Advisors.</p>
        </div>
      </section>
      <div className="grid gap-4">
        {courses.map((course, index) => (
          <div 
            key={index} 
            className="rounded-2xl p-4 flex items-center justify-between relative overflow-hidden group"
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
            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
            
            {/* Purple gradient reflective effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700
                          bg-gradient-to-r from-transparent via-purple-500/20 to-transparent
                          translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000
                          pointer-events-none" />
            
            <div className="relative z-10 flex items-center justify-between w-full">
              <div>
                <h3 className="text-base font-semibold text-white">{course.name}</h3>
                <p className="text-sm text-white/70">{course.description}</p>
              </div>
              <Button 
                onClick={() => window.open(course.externalUrl, '_blank')} 
                size="sm"
                className="relative overflow-hidden group rounded-lg"
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
                <ArrowUpRight className="w-4 h-4 mr-1" />
                Open
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoursesPage;
