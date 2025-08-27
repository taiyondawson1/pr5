
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("Starting fix-handle-new-user function...")
    
    // Create a Supabase client with the service role key (has admin rights)
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Ensure license_keys.staff_key can be NULL
    const { error: alterTableError } = await supabase.rpc('execute_admin_query', {
      query_text: `
        -- Ensure that staff_key can be NULL in license_keys table
        ALTER TABLE IF EXISTS public.license_keys ALTER COLUMN staff_key DROP NOT NULL;
      `
    });

    if (alterTableError) {
      console.error('Error updating license_keys table:', alterTableError);
      // Non-fatal error, continue with function updates
    }

    // Update the handle_new_user function to properly handle staff_key and enrolled_by
    const { error } = await supabase.rpc('execute_admin_query', {
      query_text: `
        -- First, drop the existing triggers if they exist to avoid conflicts
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        DROP TRIGGER IF EXISTS on_auth_user_created_license_key ON auth.users;

        -- Update handle_new_user function to properly handle staff_key for staff vs customers
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS trigger
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          valid_role public.user_role;
          role_text text;
          staff_key_value text;
          is_staff boolean;
        BEGIN
          -- First, safely extract and validate the role
          role_text := COALESCE(new.raw_user_meta_data->>'role', 'customer');
          
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
          RAISE NOTICE 'Creating profile for user % with role % and staff_key %', new.id, valid_role, staff_key_value;
          
          -- Create the profile with the validated role and appropriate staff_key
          INSERT INTO public.profiles (id, role, staff_key)
          VALUES (new.id, valid_role, staff_key_value)
          ON CONFLICT (id) DO UPDATE SET
            role = EXCLUDED.role,
            staff_key = EXCLUDED.staff_key,
            updated_at = NOW();
          
          RETURN NEW;
        EXCEPTION
          WHEN others THEN
            RAISE NOTICE 'Error creating profile: %', SQLERRM;
            RETURN NEW;
        END;
        $$;

        -- Update the create_customer_license function to handle staff_key properly
        CREATE OR REPLACE FUNCTION public.create_customer_license()
        RETURNS trigger
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          new_license_key TEXT;
          enrolled_by_key TEXT := new.raw_user_meta_data->>'enrolled_by';
          role_text TEXT := COALESCE(new.raw_user_meta_data->>'role', 'customer');
          retry_count INTEGER := 0;
          max_retries INTEGER := 3;
          customer_name TEXT;
          is_staff BOOLEAN;
        BEGIN
          -- Log for debugging
          RAISE NOTICE 'Creating license key for user % with role % and enrolled_by %', new.id, role_text, enrolled_by_key;
          
          -- Determine if this is a staff member or customer
          is_staff := (role_text = 'ceo' OR role_text = 'admin' OR role_text = 'enroller');
          
          -- Use email or meta data for customer name 
          customer_name := COALESCE(new.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
          
          -- Generate a new unique license key
          LOOP
            new_license_key := public.generate_random_license_key();
            
            -- Exit when we find a unique key or hit max retries
            EXIT WHEN NOT EXISTS (
                SELECT 1 FROM public.license_keys 
                WHERE license_key = new_license_key
            ) OR retry_count >= max_retries;
            
            retry_count := retry_count + 1;
          END LOOP;

          -- Insert the license key with proper field assignments
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
              enrolled_by,    -- Only set for customers 
              staff_key       -- Only set for staff members
          ) VALUES (
              NEW.id,
              new_license_key,
              '{}',
              'active',
              'standard',
              customer_name,
              NEW.email,
              '',
              'EA-001',
              CASE WHEN NOT is_staff THEN enrolled_by_key ELSE NULL END,         -- Customers: enrolled_by = key used
              CASE WHEN is_staff THEN new.raw_user_meta_data->>'staff_key' ELSE NULL END  -- Staff: staff_key = their own key
          )
          ON CONFLICT (user_id) DO NOTHING;
              
          -- Also insert into customer_accounts table with proper fields
          INSERT INTO public.customer_accounts (
              user_id,
              name,
              email,
              phone,
              status,
              enrolled_by,    -- Only set for customers
              license_key
          ) VALUES (
              NEW.id,
              customer_name,
              NEW.email,
              '',
              'active',
              CASE WHEN NOT is_staff THEN enrolled_by_key ELSE NULL END,
              new_license_key
          )
          ON CONFLICT (user_id) DO NOTHING;
          
          -- Also create customer record if it doesn't exist
          INSERT INTO public.customers (
              id,
              name,
              email,
              phone,
              status,
              sales_rep_id,
              staff_key,
              revenue
          ) VALUES (
              NEW.id,
              customer_name,
              NEW.email,
              '',
              'Active',
              '00000000-0000-0000-0000-000000000000'::uuid,
              CASE WHEN is_staff THEN new.raw_user_meta_data->>'staff_key' ELSE NULL END,
              '$0'
          )
          ON CONFLICT (id) DO NOTHING;
          
          RETURN NEW;
        EXCEPTION
          WHEN others THEN
            -- Log error but don't fail the entire transaction
            RAISE NOTICE 'Error creating license key and customer account: %', SQLERRM;
            RETURN NEW;
        END;
        $$;

        -- Recreate both triggers to ensure both functions get called
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
            
        CREATE TRIGGER on_auth_user_created_license_key
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.create_customer_license();
      `
    })

    if (error) {
      console.error('Error updating handle_new_user function:', error)
      return new Response(JSON.stringify({ 
        error: 'Failed to update handle_new_user function',
        details: error
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }

    // Run the repair function to fix any existing records with incorrect data
    const { error: repairError } = await supabase.rpc('repair_missing_customer_records')

    if (repairError) {
      console.error('Error running repair function:', repairError)
      // Non-fatal error, continue with response
    }

    return new Response(JSON.stringify({ 
      message: "Successfully updated database triggers and fixed existing records to properly handle enrollment keys.",
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (err) {
    console.error('Error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
