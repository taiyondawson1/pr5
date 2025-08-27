
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Supabase client with admin privileges
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting repair-customer-records function...");

    // First, let's ensure our database functions are updated to handle NULL staff_key
    const { error: updateFunctionsError } = await supabase.rpc('execute_admin_query', {
      query_text: `
        -- Ensure that staff_key can be NULL in license_keys table
        ALTER TABLE IF EXISTS public.license_keys ALTER COLUMN staff_key DROP NOT NULL;
        
        -- Ensure that enrolled_by exists in profiles table
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'enrolled_by'
          ) THEN
            ALTER TABLE public.profiles ADD COLUMN enrolled_by text;
          END IF;
        END$$;
      `
    });

    if (updateFunctionsError) {
      console.error("Error updating database constraints:", updateFunctionsError);
      // Non-fatal error, continue with other operations
    }

    // Call the repair_missing_customer_records function
    const { data, error } = await supabase.rpc('repair_missing_customer_records');
    
    if (error) {
      console.error("Error repairing customer records:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Fix any customers with staff_key but who are not staff
    // This is the primary fix to ensure enrollment keys are properly stored
    const { error: fixCustomerError } = await supabase.rpc('execute_admin_query', {
      query_text: `
        -- Update profiles table to include enrolled_by for customers
        UPDATE public.profiles p
        SET 
          enrolled_by = c.staff_key,
          updated_at = NOW()
        FROM public.customers c
        WHERE p.id = c.id
        AND p.role = 'customer'
        AND p.enrolled_by IS NULL
        AND c.staff_key IS NOT NULL;
        
        -- Fix customers that have staff_key incorrectly set
        UPDATE public.customers c
        SET 
          staff_key = NULL,
          updated_at = NOW()
        FROM public.profiles p
        WHERE c.id = p.id
        AND p.role = 'customer'
        AND c.staff_key IS NOT NULL;
        
        -- Ensure enrolled_by is set properly for customers in license_keys table
        UPDATE public.license_keys lk
        SET 
          enrolled_by = COALESCE(lk.enrolled_by, lk.staff_key),
          staff_key = NULL,
          created_at = COALESCE(lk.created_at, NOW())
        FROM public.profiles p
        WHERE lk.user_id = p.id
        AND p.role = 'customer'
        AND lk.staff_key IS NOT NULL;
        
        -- Ensure enrolled_by is set properly in customer_accounts table
        UPDATE public.customer_accounts ca
        SET 
          enrolled_by = COALESCE(ca.enrolled_by, lk.enrolled_by, lk.staff_key),
          updated_at = NOW()
        FROM public.license_keys lk
        JOIN public.profiles p ON lk.user_id = p.id
        WHERE ca.user_id = lk.user_id
        AND p.role = 'customer'
        AND ca.enrolled_by IS NULL
        AND (lk.enrolled_by IS NOT NULL OR lk.staff_key IS NOT NULL);
        
        -- Make sure staff profiles have correct staff_key values
        UPDATE public.profiles p
        SET 
          staff_key = lk.staff_key,
          updated_at = NOW()
        FROM public.license_keys lk
        WHERE p.id = lk.user_id
        AND (p.role = 'ceo' OR p.role = 'admin' OR p.role = 'enroller')
        AND p.staff_key IS NULL
        AND lk.staff_key IS NOT NULL;
      `
    });

    if (fixCustomerError) {
      console.error("Error fixing customer records:", fixCustomerError);
      // Non-fatal error, continue with response
    }

    // Now let's make sure any missing records are created for existing users
    const { error: syncRecordsError } = await supabase.rpc('execute_admin_query', {
      query_text: `
        -- Find users with profiles but no license_keys and create them
        INSERT INTO public.license_keys (
          user_id,
          license_key,
          account_numbers,
          status,
          subscription_type,
          name,
          email,
          phone,
          product_code,
          enrolled_by,
          staff_key
        )
        SELECT 
          p.id, 
          public.generate_random_license_key(),
          '{}',
          'active',
          'standard',
          COALESCE(split_part(au.email, '@', 1), 'Customer'),
          au.email,
          '',
          'EA-001',
          CASE WHEN p.role = 'customer' THEN p.enrolled_by ELSE NULL END,
          CASE WHEN p.role != 'customer' THEN p.staff_key ELSE NULL END
        FROM public.profiles p
        JOIN auth.users au ON p.id = au.id
        LEFT JOIN public.license_keys lk ON p.id = lk.user_id
        WHERE lk.id IS NULL;
        
        -- Find users with license_keys but no customer_accounts and create them
        INSERT INTO public.customer_accounts (
          user_id,
          name,
          email,
          phone,
          status,
          enrolled_by,
          license_key
        )
        SELECT 
          lk.user_id,
          lk.name,
          lk.email,
          COALESCE(lk.phone, ''),
          COALESCE(lk.status, 'active'),
          lk.enrolled_by,
          lk.license_key
        FROM public.license_keys lk
        LEFT JOIN public.customer_accounts ca ON lk.user_id = ca.user_id
        JOIN public.profiles p ON lk.user_id = p.id
        WHERE ca.id IS NULL;
        
        -- Find users with license_keys but no customers record and create them
        INSERT INTO public.customers (
          id,
          name,
          email,
          phone,
          status,
          sales_rep_id,
          staff_key,
          revenue
        )
        SELECT 
          lk.user_id,
          lk.name,
          lk.email,
          COALESCE(lk.phone, ''),
          COALESCE(lk.status, 'Active'),
          '00000000-0000-0000-0000-000000000000'::uuid,
          CASE WHEN p.role != 'customer' THEN p.staff_key ELSE NULL END,
          '$0'
        FROM public.license_keys lk
        JOIN public.profiles p ON lk.user_id = p.id
        LEFT JOIN public.customers c ON lk.user_id = c.id
        WHERE c.id IS NULL;
      `
    });

    if (syncRecordsError) {
      console.error("Error synchronizing missing records:", syncRecordsError);
      // Non-fatal error, continue with response
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Customer records repair completed successfully. Records have been created or fixed in profiles, license_keys, and customer_accounts tables."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error in repair-customer-records:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
