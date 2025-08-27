import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabaseUrl, supabaseKey } from "@/lib/supabase";

const MetaTraderConnection = () => {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: "Connection details copied to clipboard",
      });
    });
  };

  return (
    <Card className="bg-darkBlue/40 backdrop-blur-sm border-mediumGray/20">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-softWhite">MetaTrader Connection Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-softWhite">URL:</p>
          <div className="flex items-center gap-2">
            <code className="bg-black/30 p-2 rounded text-softWhite flex-1">
              {`${supabaseUrl}/rest/v1/account_metrics`}
            </code>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => copyToClipboard(`${supabaseUrl}/rest/v1/account_metrics`)}
            >
              Copy
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-softWhite">Headers:</p>
          <div className="flex items-center gap-2">
            <code className="bg-black/30 p-2 rounded text-softWhite flex-1">
              {`apikey: ${supabaseKey}\nContent-Type: application/json`}
            </code>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => copyToClipboard(`apikey: ${supabaseKey}\nContent-Type: application/json`)}
            >
              Copy
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-softWhite">Example JSON Body:</p>
          <div className="flex items-center gap-2">
            <code className="bg-black/30 p-2 rounded text-softWhite flex-1 whitespace-pre">
{`{
  "account_number": "YOUR_ACCOUNT_NUMBER",
  "balance": 10000.00,
  "equity": 10050.00,
  "floating": 50.00,
  "margin": 100.00,
  "freeMargin": 9900.00,
  "marginLevel": 100.50,
  "openPositions": 1
}`}
            </code>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => copyToClipboard(`{
  "account_number": "YOUR_ACCOUNT_NUMBER",
  "balance": 10000.00,
  "equity": 10050.00,
  "floating": 50.00,
  "margin": 100.00,
  "freeMargin": 9900.00,
  "marginLevel": 100.50,
  "openPositions": 1
}`)}
            >
              Copy
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetaTraderConnection;