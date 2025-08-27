
import { useNavigate } from "react-router-dom";
import SplineWidget from "@/components/SplineWidget";
import styles from "./Home.module.css";
import { ArrowRight, TrendingUp, Shield, Zap, Star } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  
  return (
    <div className={`w-screen h-screen relative text-white overflow-hidden ${styles.homeContainer}`}>
      {/* Spline background */}
      <div className={styles.galaxyBackground}>
        <SplineWidget />
      </div>
      
            {/* Hero Section */}
      <section className={`relative flex flex-col items-center justify-start h-screen px-4 pt-20 ${styles.content}`}>
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          {/* Main Hero Content */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-4 border border-white/20">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-white/90">Advanced Trading Platform</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Trade
              </span>
              <br />
              <span className="text-white">the Future</span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto mb-6 leading-relaxed">
              Experience the next generation of trading with AI-powered analytics, 
              expert advisors, and real-time market insights.
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex items-center justify-center">
            <button 
              onClick={() => navigate('/login')} 
              className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center gap-3"
            >
              Start Trading Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
