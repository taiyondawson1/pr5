
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parse } from "date-fns";

interface DailyGainProps {
  accountId?: string;
}

interface DailyGainData {
  date: string;
  value: number;
}

const DailyGainChart = ({ accountId }: DailyGainProps) => {
  const [dailyGainData, setDailyGainData] = useState<DailyGainData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchDailyGain = async () => {
      if (!accountId) return;

      const session = localStorage.getItem("myfxbook_session");
      if (!session) return;

      setIsLoading(true);
      try {
        // Get dates for last 30 days
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);

        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');

        const response = await fetch(
          `https://www.myfxbook.com/api/get-daily-gain.json?session=${encodeURIComponent(
            session
          )}&id=${encodeURIComponent(accountId)}&start=${startStr}&end=${endStr}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch daily gain data");
        }

        const data = await response.json();
        console.log("Daily Gain API Response:", data);

        if (!data.error && data.dailyGain) {
          const formattedData = data.dailyGain.flat().map((item: any) => {
            try {
              const parsedDate = parse(item.date, 'MM/dd/yyyy', new Date());
              return {
                date: format(parsedDate, 'yyyy-MM-dd'),
                value: Number(item.value),
              };
            } catch (error) {
              console.error("Error parsing date:", item.date, error);
              return null;
            }
          }).filter((item): item is DailyGainData => item !== null);
          
          setDailyGainData(formattedData);
        }
      } catch (error) {
        console.error("Error fetching daily gain data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDailyGain();
  }, [accountId]);

  return (
    <div className="w-full mt-4">
      <h2 className="text-lg font-medium text-softWhite px-4 mb-4">Last 30 days</h2>
      {isLoading ? (
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-softWhite">Loading data...</p>
        </div>
      ) : dailyGainData.length > 0 ? (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={dailyGainData} 
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false}
                stroke="#403E43"
                opacity={0.4}
              />
              <XAxis
                dataKey="date"
                tickFormatter={(str) => {
                  try {
                    return format(new Date(str), 'dd MMM');
                  } catch (error) {
                    console.error("Error formatting tick:", str, error);
                    return str;
                  }
                }}
                stroke="#8E9196"
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis 
                stroke="#8E9196"
                tickLine={false}
                axisLine={false}
                dx={-10}
                tickFormatter={(value) => `${value}k`}
                domain={[-2, 4]}
                ticks={[-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4]}
              />
              <Tooltip
                labelFormatter={(label) => {
                  try {
                    return format(new Date(label as string), 'dd MMM, yyyy');
                  } catch (error) {
                    console.error("Error formatting tooltip label:", label, error);
                    return label;
                  }
                }}
                formatter={(value: number) => [`${value.toFixed(2)}%`, 'Gain']}
                contentStyle={{
                  backgroundColor: '#1A1F2C',
                  border: '1px solid #403E43',
                  borderRadius: '6px',
                  color: '#fff'
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#0EA5E9"
                strokeWidth={2}
                dot={false}
                activeDot={{ 
                  r: 4, 
                  fill: "#0EA5E9",
                  stroke: "#0EA5E9" 
                }}
                name="Daily Gain"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-softWhite">No daily gain data available</p>
        </div>
      )}
    </div>
  );
};

export default DailyGainChart;
