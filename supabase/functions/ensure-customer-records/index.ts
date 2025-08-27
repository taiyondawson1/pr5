
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
    console.log("Starting ensure-customer-records function...")
    
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

    // Update the database trigger to ensure customer records are created
    const { error } = await supabase.rpc('execute_admin_query', {
      query_text: `
        -- First, update handle_new_user function to properly handle user creation
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
          
          -- Create the profile with the validated role and appropriate staff_key
          INSERT INTO public.profiles (id, role, staff_key, enrolled_by, enroller)
          VALUES (
            new.id, 
            valid_role, 
            staff_key_value,
            CASE WHEN NOT is_staff THEN new.raw_user_meta_data->>'enrolled_by' ELSE NULL END,
            CASE WHEN NOT is_staff THEN new.raw_user_meta_data->>'enrolled_by' ELSE NULL END
          )
          ON CONFLICT (id) DO UPDATE SET
            role = EXCLUDED.role,
            staff_key = EXCLUDED.staff_key,
            enrolled_by = EXCLUDED.enrolled_by,
            enroller = EXCLUDED.enroller,
            updated_at = NOW();
          
          RETURN NEW;
        END;
        $$;

        -- Next, ensure create_customer_license is properly configured
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

          -- Insert the license key record (for ALL users, regardless of role)
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
          ON CONFLICT (user_id) DO UPDATE SET
              name = EXCLUDED.name,
              email = EXCLUDED.email,
              updated_at = NOW();
              
          -- Insert into customer_accounts table (for ALL users, regardless of role)
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
          ON CONFLICT (user_id) DO UPDATE SET
              name = EXCLUDED.name,
              email = EXCLUDED.email,
              updated_at = NOW();
          
          -- Insert customer record (for ALL users, regardless of role)
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
          ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              email = EXCLUDED.email,
              updated_at = NOW();
          
          RETURN NEW;
        END;
        $$;

        -- Create a function to fix existing users without license keys or customer accounts
        CREATE OR REPLACE FUNCTION public.fix_missing_customer_records()
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          user_record RECORD;
          new_license_key TEXT;
          retry_count INTEGER;
          role_text TEXT;
          is_staff BOOLEAN;
        BEGIN
          -- Find all users with missing license_keys or customer_accounts
          FOR user_record IN 
            SELECT au.id, au.email, p.role, p.staff_key, p.enrolled_by, p.enroller
            FROM auth.users au
            JOIN public.profiles p ON au.id = p.id
            LEFT JOIN public.license_keys lk ON au.id = lk.user_id
            LEFT JOIN public.customer_accounts ca ON au.id = ca.user_id
            WHERE lk.id IS NULL OR ca.id IS NULL
          LOOP
            -- Determine if this is a staff member
            is_staff := (user_record.role = 'ceo' OR user_record.role = 'admin' OR user_record.role = 'enroller');
            
            -- Check if license key exists, create if not
            IF NOT EXISTS (SELECT 1 FROM public.license_keys WHERE user_id = user_record.id) THEN
              -- Generate a new unique license key
              retry_count := 0;
              LOOP
                new_license_key := public.generate_random_license_key();
                
                EXIT WHEN NOT EXISTS (
                    SELECT 1 FROM public.license_keys 
                    WHERE license_key = new_license_key
                ) OR retry_count >= 3;
                
                retry_count := retry_count + 1;
              END LOOP;
              
              -- Insert license key record
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
                staff_key,
                enrolled_by
              ) VALUES (
                user_record.id,
                new_license_key,
                '{}',
                'active',
                'standard',
                split_part(user_record.email, '@', 1),
                user_record.email,
                '',
                'EA-001', 
                CASE WHEN is_staff THEN user_record.staff_key ELSE NULL END,
                CASE WHEN NOT is_staff THEN user_record.enrolled_by ELSE NULL END
              );
            ELSE
              -- Get existing license key
              SELECT license_key INTO new_license_key 
              FROM public.license_keys 
              WHERE user_id = user_record.id;
            END IF;
            
            -- Check if customer_accounts exists, create if not
            IF NOT EXISTS (SELECT 1 FROM public.customer_accounts WHERE user_id = user_record.id) THEN
              INSERT INTO public.customer_accounts (
                user_id,
                name,
                email,
                phone,
                status,
                enrolled_by,
                license_key
              ) VALUES (
                user_record.id,
                split_part(user_record.email, '@', 1),
                user_record.email,
                '',
                'active',
                CASE WHEN NOT is_staff THEN user_record.enrolled_by ELSE NULL END,
                new_license_key
              );
            END IF;
            
            -- Check if customers record exists, create if not
            IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = user_record.id) THEN
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
                user_record.id,
                split_part(user_record.email, '@', 1),
                user_record.email,
                '',
                'Active',
                '00000000-0000-0000-0000-000000000000'::uuid,
                CASE WHEN is_staff THEN user_record.staff_key ELSE NULL END,
                '$0'
              );
            END IF;
          END LOOP;
        END;
        $$;

        -- Run the fix function to repair any missing records
        SELECT public.fix_missing_customer_records();
      `
    })

    if (error) {
      console.error('Error updating database triggers:', error)
      return new Response(JSON.stringify({ 
        error: 'Failed to update database triggers',
        details: error
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }

    // Now check if there are any users without records and fix them
    const { error: fixError } = await supabase.rpc('fix_missing_customer_records')

    if (fixError) {
      console.error('Error running fix_missing_customer_records:', fixError)
      // Continue anyway since we've updated the triggers
    }

    return new Response(JSON.stringify({ 
      message: "Successfully updated database triggers to ensure customer records are created for all new accounts.",
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
