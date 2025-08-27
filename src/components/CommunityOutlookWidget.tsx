import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface Country {
  name: string;
  code: string;
  longVolume: number;
  shortVolume: number;
  longPositions: number;
  shortPositions: number;
}

interface CommunityOutlookResponse {
  error: boolean;
  message: string;
  countries: Country[];
}

const CommunityOutlookWidget = ({ symbol = "eurusd" }: { symbol?: string }) => {
  const [data, setData] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const session = localStorage.getItem("myfxbook_session");
      if (!session) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No active session found. Please login again.",
        });
        return;
      }

      try {
        const response = await fetch(
          `https://www.myfxbook.com/api/get-community-outlook-by-country.json?session=${encodeURIComponent(
            session
          )}&symbol=${encodeURIComponent(symbol)}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch community outlook data");
        }

        const data: CommunityOutlookResponse = await response.json();
        console.log("Community Outlook Response:", data);

        if (!data.error) {
          setData(data.countries);
        } else {
          throw new Error(data.message || "Failed to fetch community outlook data");
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch community outlook data",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [symbol, toast]);

  return (
    <Card className="bg-darkBlue/40 border-mediumGray/20 backdrop-blur-sm shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Community Outlook - {symbol.toUpperCase()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-4">Loading data...</p>
        ) : data.length > 0 ? (
          <ScrollArea className="h-[480px]"> {/* Height for approximately 12 rows */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>Long Volume</TableHead>
                  <TableHead>Short Volume</TableHead>
                  <TableHead>Long Positions</TableHead>
                  <TableHead>Short Positions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((country) => (
                  <TableRow key={country.code}>
                    <TableCell>{country.name}</TableCell>
                    <TableCell>{country.longVolume.toFixed(2)}%</TableCell>
                    <TableCell>{country.shortVolume.toFixed(2)}%</TableCell>
                    <TableCell>{country.longPositions}</TableCell>
                    <TableCell>{country.shortPositions}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <p className="text-center text-muted-foreground py-4">No data available</p>
        )}
      </CardContent>
    </Card>
  );
};

export default CommunityOutlookWidget;