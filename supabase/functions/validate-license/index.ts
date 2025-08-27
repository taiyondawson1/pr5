
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  licenseKey: string;
  accountNumber: string;
}

type ValidationResponse = {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    licenseKey: string;
    accountNumbers: string[];
    status?: string;
    subscription_type?: string;
  };
};

serve(async (req) => {
  console.log("License validation request received");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with admin privileges
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse request body
    const requestData = await req.json() as ValidationRequest;
    const { licenseKey, accountNumber } = requestData;
    
    console.log(`Validating license key: ${licenseKey} for account: ${accountNumber}`);
    
    if (!licenseKey || !accountNumber) {
      console.log("Missing license key or account number");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Missing license key or account number"
        } as ValidationResponse),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    // Find the license key in the database
    const { data: licenseData, error: licenseError } = await supabase
      .from('license_keys')
      .select('*')
      .eq('license_key', licenseKey)
      .eq('status', 'active')
      .single();
    
    // Handle license not found or inactive
    if (licenseError) {
      console.log(`License error: ${licenseError.message}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: licenseError.code === 'PGRST116' 
            ? "Invalid license key" 
            : `Database error: ${licenseError.message}`
        } as ValidationResponse),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401 
        }
      );
    }
    
    if (!licenseData) {
      console.log("License not found or inactive");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Invalid or inactive license key"
        } as ValidationResponse),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401 
        }
      );
    }
    
    // Check if license is expired
    if (licenseData.expiry_date && new Date(licenseData.expiry_date) < new Date()) {
      console.log(`License expired: ${licenseKey}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "License key has expired"
        } as ValidationResponse),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401 
        }
      );
    }
    
    // Check if account number is in the authorized list
    const accountNumbers = licenseData.account_numbers || [];
    const isAuthorized = accountNumbers.includes(accountNumber);
    
    if (!isAuthorized) {
      console.log(`Account not authorized: ${accountNumber} for license: ${licenseKey}`);
      
      // Check if this account was previously deleted
      const { data: deletedAccount } = await supabase
        .from('mt_accounts')
        .select('id')
        .eq('login', accountNumber)
        .eq('user_id', licenseData.user_id)
        .not('deleted_at', 'is', null)
        .single();
      
      if (deletedAccount) {
        console.log(`Account ${accountNumber} was previously deleted and cannot be reauthorized`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "This account was previously deleted and cannot be reauthorized"
          } as ValidationResponse),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403 
          }
        );
      }
      
      // If the account list is empty, we can automatically add this account
      if (accountNumbers.length === 0) {
        console.log(`Adding first account ${accountNumber} to license ${licenseKey}`);
        
        const updatedAccountNumbers = [accountNumber];
        
        const { error: updateError } = await supabase
          .from('license_keys')
          .update({ account_numbers: updatedAccountNumbers })
          .eq('license_key', licenseKey);
        
        if (updateError) {
          console.log(`Error adding account: ${updateError.message}`);
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: `Error authorizing account: ${updateError.message}`
            } as ValidationResponse),
            { 
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 500 
            }
          );
        }
        
        console.log(`Account ${accountNumber} successfully added to license ${licenseKey}`);
        
        // Return success with the updated account numbers
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "First account automatically authorized",
            data: {
              userId: licenseData.user_id,
              licenseKey: licenseData.license_key,
              accountNumbers: updatedAccountNumbers,
              status: licenseData.status,
              subscription_type: licenseData.subscription_type
            }
          } as ValidationResponse),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Account number not authorized for this license"
        } as ValidationResponse),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401 
        }
      );
    }
    
    console.log(`License validated successfully: ${licenseKey} for account: ${accountNumber}`);
    
    // License valid and account authorized
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "License valid and account authorized",
        data: {
          userId: licenseData.user_id,
          licenseKey: licenseData.license_key,
          accountNumbers: licenseData.account_numbers,
          status: licenseData.status,
          subscription_type: licenseData.subscription_type
        }
      } as ValidationResponse),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error("Error validating license:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Server error during license validation",
        error: error instanceof Error ? error.message : String(error)
      } as ValidationResponse),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
