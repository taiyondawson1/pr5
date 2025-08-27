
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface GainWidgetProps {
  accountId?: string;
}

const GainWidget = ({ accountId }: GainWidgetProps) => {
  const [gain, setGain] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchGain = async () => {
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
        // Get dates for last year
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);

        const response = await fetch(
          `https://www.myfxbook.com/api/get-gain.json?session=${encodeURIComponent(
            session
          )}&id=${encodeURIComponent(accountId)}&start=${startDate.toISOString().split('T')[0]}&end=${endDate.toISOString().split('T')[0]}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch gain data");
        }

        const data = await response.json();
        console.log("Gain API Response:", data);

        if (!data.error) {
          setGain(data.value);
        } else {
          throw new Error(data.message || "Failed to fetch gain data");
        }
      } catch (error) {
        console.error("Error fetching gain:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch gain data",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchGain();
  }, [accountId, toast]);

  return (
    <Card className="w-full bg-darkBlue/40 border-mediumGray/20 rounded-none">
      <CardHeader className="flex items-center justify-center">
        <CardTitle className="text-xl font-bold text-softWhite text-center">Total Gain (1 Year)</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        {isLoading ? (
          <p className="text-center text-softWhite">Loading...</p>
        ) : (
          <div className="text-3xl font-bold text-center">
            {gain !== null ? (
              <span className="text-softWhite">
                {gain >= 0 ? "+" : ""}{gain.toFixed(2)}%
              </span>
            ) : (
              <span className="text-softWhite">N/A</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GainWidget;
