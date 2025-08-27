
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const requestData = await req.json();
    const userId = requestData?.userId;
    const userEmail = requestData?.userEmail;
    const fixSchema = requestData?.fixSchema !== false; // Default to true
    const fixTriggers = requestData?.fixTriggers !== false; // Default to true
    
    console.log("fix-missing-user-records called with params:", { userId, userEmail, fixSchema, fixTriggers });
    
    // Get Supabase client with admin privileges
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fix schema if requested
    if (fixSchema) {
      console.log("Fixing database schema...");
      
      // Add all the missing columns to the tables
      const { error: schemaError } = await supabase.rpc('execute_admin_query', {
        query_text: `
          -- Add the 'enroller' column to license_keys table if it doesn't exist
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'license_keys' 
              AND column_name = 'enroller'
            ) THEN
              ALTER TABLE public.license_keys ADD COLUMN enroller text;
            END IF;
            
            -- Add 'enrolled_by' column to license_keys if it doesn't exist
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'license_keys' 
              AND column_name = 'enrolled_by'
            ) THEN
              ALTER TABLE public.license_keys ADD COLUMN enrolled_by text;
            END IF;
            
            -- Add 'enrolled_by' column to profiles if it doesn't exist
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'profiles' 
              AND column_name = 'enrolled_by'
            ) THEN
              ALTER TABLE public.profiles ADD COLUMN enrolled_by text;
            END IF;
            
            -- Add 'enroller' column to profiles if it doesn't exist
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'profiles' 
              AND column_name = 'enroller'
            ) THEN
              ALTER TABLE public.profiles ADD COLUMN enroller text;
            END IF;
            
            -- Add 'enrolled_by' column to customer_accounts if it doesn't exist
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'customer_accounts' 
              AND column_name = 'enrolled_by'
            ) THEN
              ALTER TABLE public.customer_accounts ADD COLUMN enrolled_by text;
            END IF;
            
            -- Add 'enroller' column to customers if it doesn't exist
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'customers' 
              AND column_name = 'enroller'
            ) THEN
              ALTER TABLE public.customers ADD COLUMN enroller text;
            END IF;
            
            -- Add 'referred_by' column to all key tables for future use
            -- profiles
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'profiles' 
              AND column_name = 'referred_by'
            ) THEN
              ALTER TABLE public.profiles ADD COLUMN referred_by text;
            END IF;
            
            -- license_keys
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'license_keys' 
              AND column_name = 'referred_by'
            ) THEN
              ALTER TABLE public.license_keys ADD COLUMN referred_by text;
            END IF;
            
            -- customer_accounts
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'customer_accounts' 
              AND column_name = 'referred_by'
            ) THEN
              ALTER TABLE public.customer_accounts ADD COLUMN referred_by text;
            END IF;
            
            RAISE NOTICE 'Schema update completed';
          END$$;
        `
      });

      if (schemaError) {
        console.error("Error updating schema:", schemaError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Schema update failed: " + schemaError.message 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
      
      console.log("Database schema update successful");
    }

    // Fix database triggers if requested
    if (fixTriggers) {
      console.log("Fixing database triggers...");
      
      // Update the handle_new_user function
      const { error: triggerError } = await supabase.rpc('execute_admin_query', {
        query_text: `
          -- Update handle_new_user function to handle enrollment data
          CREATE OR REPLACE FUNCTION public.handle_new_user()
           RETURNS trigger
           LANGUAGE plpgsql
           SECURITY DEFINER
          AS $function$
                  DECLARE
                    valid_role public.user_role;
                    role_text text;
                    staff_key_value text;
                    is_staff boolean;
                    referrer_code text;
                  BEGIN
                    -- First, safely extract and validate the role
                    role_text := COALESCE(new.raw_user_meta_data->>'role', 'customer');
                    
                    -- Get referral code if present
                    referrer_code := new.raw_user_meta_data->>'referred_by';
                    
                    -- Validate the role and convert to enum
                    CASE role_text
                      WHEN 'ceo' THEN valid_role := 'ceo'::public.user_role;
                      WHEN 'admin' THEN valid_role := 'admin'::public.user_role;
                      WHEN 'enroller' THEN valid_role := 'enroller'::public.user_role;
                      ELSE valid_role := 'customer'::public.user_role;
                    END CASE;
                    
                    -- Determine if this is a staff member (non-customer)
                    is_staff := (valid_role = 'ceo' OR valid_role = 'admin' OR valid_role = 'enroller');
                    
                    -- Set staff_key based on role - only for staff members
                    IF is_staff THEN
                      -- Staff members get their staff_key stored
                      staff_key_value := new.raw_user_meta_data->>'staff_key';
                    ELSE
                      -- Customers should never have a staff_key (they have enrolled_by instead)
                      staff_key_value := NULL;
                    END IF;
                    
                    -- Log for debugging
                    RAISE NOTICE 'Creating profile for user % with role % and staff_key %, referred_by %', 
                      new.id, valid_role, staff_key_value, referrer_code;
                    
                    -- Create the profile with the validated role and appropriate staff_key
                    INSERT INTO public.profiles (
                      id, 
                      role, 
                      staff_key,
                      referred_by,
                      enrolled_by,
                      enroller
                    )
                    VALUES (
                      new.id, 
                      valid_role, 
                      staff_key_value,
                      referrer_code,
                      CASE WHEN NOT is_staff THEN referrer_code ELSE NULL END,
                      CASE WHEN NOT is_staff THEN referrer_code ELSE NULL END
                    )
                    ON CONFLICT (id) DO UPDATE SET
                      role = EXCLUDED.role,
                      staff_key = EXCLUDED.staff_key,
                      referred_by = COALESCE(EXCLUDED.referred_by, profiles.referred_by),
                      enrolled_by = COALESCE(EXCLUDED.enrolled_by, profiles.enrolled_by),
                      enroller = COALESCE(EXCLUDED.enroller, profiles.enroller),
                      updated_at = NOW();
                    
                    RETURN NEW;
                  EXCEPTION
                    WHEN others THEN
                      RAISE NOTICE 'Error creating profile: %', SQLERRM;
                      RETURN NEW;
                  END;
                  $function$
        `
      });
      
      if (triggerError) {
        console.error("Error updating trigger function:", triggerError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Trigger update failed: " + triggerError.message 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
      
      console.log("Database triggers updated successfully");
    }

    // Fix specific user records if userId or userEmail is provided
    if (userId || userEmail) {
      let targetUserId = userId;
      
      // If only userEmail provided, look up the user ID
      if (!targetUserId && userEmail) {
        const { data: userData, error: userError } = await supabase
          .from('auth.users')
          .select('id')
          .eq('email', userEmail)
          .maybeSingle();
          
        if (userError || !userData) {
          console.error("Error finding user by email:", userError);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "User not found with email: " + userEmail 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
          );
        }
        
        targetUserId = userData.id;
      }
      
      console.log("Fixing records for user:", targetUserId);
      
      // Try to repair all records for this specific user
      const { error: repairError } = await supabase.rpc('repair_missing_customer_records', {
        target_user_id: targetUserId
      });
      
      if (repairError) {
        console.error("Error repairing user records:", repairError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Failed to repair user records: " + repairError.message
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
      
      console.log("User records fixed successfully");
    } else {
      // Fix all user records if no specific user provided
      console.log("Fixing all user records");
      
      const { error: repairError } = await supabase.rpc('repair_missing_customer_records');
      
      if (repairError) {
        console.error("Error repairing all user records:", repairError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Failed to repair all user records: " + repairError.message
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
      
      console.log("All user records fixed successfully");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "User records, database schema, and triggers have been successfully updated."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error in fix-missing-user-records:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
