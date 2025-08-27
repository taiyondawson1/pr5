
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useStaffKeyValidation } from "@/hooks/use-staff-key-validation";
import { Alert, AlertDescription } from "@/components/ui/alert";

const EnrollmentFixer = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [enrollmentKey, setEnrollmentKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { staffKeyInfo, isLoading: isValidating } = useStaffKeyValidation(enrollmentKey);

  const handleFixEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !enrollmentKey.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide both email and enrollment key",
      });
      return;
    }

    if (!staffKeyInfo.isValid) {
      toast({
        variant: "destructive",
        title: "Invalid Enrollment Key",
        description: "The enrollment key provided is invalid",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.functions.invoke('fix-enrollment-data', {
        body: { userEmail: email, enrollmentKey }
      });
      
      if (error) {
        console.error("Error fixing enrollment data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to fix enrollment data",
        });
        return;
      }
      
      toast({
        title: "Success",
        description: "User enrollment data has been fixed",
      });
      
      setEmail("");
    } catch (error) {
      console.error("Error fixing enrollment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 mt-16">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Fix User Enrollment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFixEnrollment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">User Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="enrollmentKey">Enrollment Key</Label>
              <Input
                id="enrollmentKey"
                type="text"
                placeholder="Enter enrollment key"
                value={enrollmentKey}
                onChange={(e) => setEnrollmentKey(e.target.value)}
                required
                disabled={isLoading}
                className={`${
                  enrollmentKey && !isValidating ? 
                    (staffKeyInfo.isValid ? 'border-green-500' : 'border-red-500') : 
                    ''
                }`}
              />
              
              {enrollmentKey && !isValidating && !staffKeyInfo.isValid && (
                <Alert variant="destructive" className="mt-2 py-2">
                  <AlertDescription>
                    This enrollment key is invalid or inactive
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading || isValidating}
            >
              {isLoading ? "Fixing Enrollment..." : "Fix Enrollment"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnrollmentFixer;
