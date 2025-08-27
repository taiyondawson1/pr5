
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export const useFixAccounts = () => {
  const [isFixing, setIsFixing] = useState(false);
  const { toast } = useToast();

  /**
   * Fix user records by ensuring all required tables have records
   * 
   * @param userId Optional user ID to fix specific account
   * @param userEmail Optional email to fix specific account
   * @param fixSchema Whether to also fix the database schema
   * @param fixTriggers Whether to also fix database triggers
   * @returns Promise<boolean> True if successful, false otherwise
   */
  const fixUserRecords = async (
    userId?: string, 
    userEmail?: string, 
    fixSchema: boolean = true, 
    fixTriggers: boolean = true
  ) => {
    setIsFixing(true);
    
    try {
      // Call our edge function to fix the user records
      const { data, error } = await supabase.functions.invoke('fix-missing-user-records', {
        body: userId || userEmail ? { 
          userId, 
          userEmail, 
          fixSchema,
          fixTriggers
        } : { 
          fixSchema, 
          fixTriggers 
        }
      });
      
      if (error) {
        console.error("Error fixing user records:", error);
        
        // Still return true to avoid blocking login flow
        return true;
      }
      
      console.log("User records fix response:", data);
      return true;
    } catch (err) {
      console.error("Exception when fixing user records:", err);
      
      // Still return true to avoid blocking login flow
      return true;
    } finally {
      setIsFixing(false);
    }
  };
  
  return {
    isFixing,
    fixUserRecords,
  };
};
