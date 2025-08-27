
import { useState, useEffect } from 'react';
import { formatInTimeZone } from 'date-fns-tz';

const WorldClocks = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const cities = [
    { name: 'TOKYO', timezone: 'Asia/Tokyo' },
    { name: 'LONDON', timezone: 'Europe/London' },
    { name: 'NEWYORK', timezone: 'America/New_York' }
  ];

  const getHandStyles = (timezone: string) => {
    const localTime = new Date(formatInTimeZone(time, timezone, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"));
    const hours = localTime.getHours() % 12;
    const minutes = localTime.getMinutes();
    const seconds = localTime.getSeconds();

    return {
      hours: {
        transform: `rotate(${(hours * 30) + (minutes / 2)}deg)`,
      },
      minutes: {
        transform: `rotate(${minutes * 6}deg)`,
      },
      seconds: {
        transform: `rotate(${seconds * 6}deg)`,
      },
    };
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 p-3 sm:px-5 sm:py-10">
      {cities.map((city) => {
        const handStyles = getHandStyles(city.timezone);
        
        return (
          <div key={city.name} className="flex flex-col items-center">
            {/* City Name - Moved to top */}
            <div className="mb-2 sm:mb-4">
              <span className="text-xs sm:text-sm font-medium text-mediumGray">
                {city.name}
              </span>
            </div>
            
            <div className="relative w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] md:w-[200px] md:h-[200px]">
              <div className="relative w-full h-full backdrop-blur-xl">
                {/* Hour markers */}
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-0.5 h-2 sm:h-3 bg-softWhite/50"
                    style={{
                      left: '50%',
                      top: '0',
                      transformOrigin: `50% ${window.innerWidth < 640 ? '70px' : window.innerWidth < 768 ? '90px' : '100px'}`,
                      transform: `rotate(${i * 30}deg) translateX(-50%)`
                    }}
                  />
                ))}

                {/* Clock Hands */}
                <div className="absolute inset-0">
                  {/* Hour Hand */}
                  <div
                    className="absolute w-1 h-[30px] sm:h-[35px] md:h-[40px] bg-softWhite/90 rounded-full left-1/2 bottom-1/2"
                    style={{
                      transformOrigin: 'bottom',
                      ...handStyles.hours,
                    }}
                  />
                  
                  {/* Minute Hand */}
                  <div
                    className="absolute w-0.5 h-[45px] sm:h-[50px] md:h-[60px] bg-softWhite/70 rounded-full left-1/2 bottom-1/2"
                    style={{
                      transformOrigin: 'bottom',
                      ...handStyles.minutes,
                    }}
                  />
                  
                  {/* Second Hand */}
                  <div
                    className="absolute w-[1px] h-[55px] sm:h-[60px] md:h-[70px] bg-accent-red rounded-full left-1/2 bottom-1/2"
                    style={{
                      transformOrigin: 'bottom',
                      ...handStyles.seconds,
                    }}
                  />
                  
                  {/* Center Dot */}
                  <div className="absolute w-2 h-2 bg-softWhite rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>

                {/* Digital Time */}
                <div className="absolute top-1/4 left-0 right-0 text-center">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-softWhite">
                    {formatInTimeZone(time, city.timezone, 'HH:mm')}
                  </div>
                  <div className="text-[10px] sm:text-xs text-mediumGray mt-1">
                    {formatInTimeZone(time, city.timezone, 'EEEE • MMM dd')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WorldClocks;
