
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface TotalGainCardProps {
  accountId?: string;
}

const TotalGainCard = ({ accountId }: TotalGainCardProps) => {
  const [totalGain, setTotalGain] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTotalGain = async () => {
      if (!accountId) return;

      const session = localStorage.getItem("myfxbook_session");
      if (!session) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No active session found. Please login again.",
        });
        return;
      }

      setIsLoading(true);
      try {
        // Get dates for last 30 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const response = await fetch(
          `https://www.myfxbook.com/api/get-gain.json?session=${encodeURIComponent(
            session
          )}&id=${encodeURIComponent(accountId)}&start=${startDate.toISOString().split('T')[0]}&end=${endDate.toISOString().split('T')[0]}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch total gain data");
        }

        const data = await response.json();
        console.log("Total Gain API Response:", data);

        if (!data.error) {
          setTotalGain(data.value);
        } else {
          throw new Error(data.message || "Failed to fetch total gain data");
        }
      } catch (error) {
        console.error("Error fetching total gain:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch total gain data",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTotalGain();
  }, [accountId, toast]);

  return (
    <div className="w-full bg-[#1A1F2C] shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.3)] rounded-none">
      <div className="flex items-center justify-center p-4">
        <h3 className="text-xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-b from-[#8E9196] to-[#59595b] shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
          Total Gain (30 Days)
        </h3>
      </div>
      <div className="flex items-center justify-center p-4">
        {isLoading ? (
          <p className="text-center text-softWhite">Loading...</p>
        ) : (
          <div className="text-3xl font-bold text-center">
            {totalGain !== null ? (
              <span className="text-softWhite bg-clip-text text-transparent bg-gradient-to-b from-[#ffffff] to-[#a8a8a8] shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                {totalGain >= 0 ? "+" : ""}{totalGain.toFixed(2)}%
              </span>
            ) : (
              <span className="text-softWhite">N/A</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TotalGainCard;
