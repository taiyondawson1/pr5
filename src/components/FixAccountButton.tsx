
import { Button } from "@/components/ui/button";
import { useFixAccounts } from "@/hooks/use-fix-accounts";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

interface FixAccountButtonProps {
  variant?: "outline" | "secondary" | "link" | "destructive" | "default";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onComplete?: () => void;
}

const FixAccountButton = ({ 
  variant = "outline", 
  size = "sm", 
  className = "",
  onComplete
}: FixAccountButtonProps) => {
  const { isFixing, fixUserRecords } = useFixAccounts();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
        setUserEmail(data.user.email);
      }
    };

    getCurrentUser();
  }, []);

  const handleFix = async () => {
    if (isFixing) return;
    
    const success = await fixUserRecords(userId || undefined, userEmail || undefined);
    
    if (success && onComplete) {
      onComplete();
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      className={className}
      onClick={handleFix}
      disabled={isFixing}
    >
      {isFixing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Fixing...
        </>
      ) : (
        "Fix Account"
      )}
    </Button>
  );
};

export default FixAccountButton;
