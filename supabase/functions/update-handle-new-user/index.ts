
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
    console.log("Starting update-handle-new-user function...")
    
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

    // Update the handle_new_user function to properly handle staff_key and enrolled_by
    const { error } = await supabase.rpc('execute_admin_query', {
      query_text: `
        -- First, drop the existing triggers if they exist to avoid conflicts
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        DROP TRIGGER IF EXISTS on_auth_user_created_license_key ON auth.users;

        -- Update handle_new_user function to just handle profile creation
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS trigger
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          -- Create the profile record with different handling for staff vs customers
          INSERT INTO public.profiles (id, role, staff_key)
          VALUES (
              new.id,
              COALESCE(
                  (CASE 
                      WHEN new.raw_user_meta_data->>'role' IS NULL THEN 'customer'::public.user_role
                      ELSE (new.raw_user_meta_data->>'role')::public.user_role
                  END),
                  'customer'::public.user_role
              ),
              -- Only assign staff_key for staff members (non-customers)
              CASE
                  WHEN (new.raw_user_meta_data->>'role' = 'ceo' OR 
                       new.raw_user_meta_data->>'role' = 'admin' OR 
                       new.raw_user_meta_data->>'role' = 'enroller') 
                       THEN COALESCE(new.raw_user_meta_data->>'staff_key', NULL)
                  ELSE NULL -- No staff_key for customers
              END
          )
          ON CONFLICT (id) DO UPDATE SET
              role = EXCLUDED.role,
              staff_key = EXCLUDED.staff_key,
              updated_at = NOW();
          
          RETURN NEW;
        END;
        $$;

        -- Create a separate function specifically for license key creation
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
            is_customer BOOLEAN;
        BEGIN
            -- Always log debugging info
            RAISE NOTICE 'Creating license key for user % with role %', new.id, role_text;
            
            -- Determine if this is a customer (we create license keys for all users now)
            is_customer := TRUE; -- Create license keys for everyone
            
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
            
            -- Insert the license key with enrolled_by if provided
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
            ) VALUES (
                NEW.id,
                new_license_key,
                '{}',
                'active',
                'standard',
                COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
                NEW.email,
                '',
                'EA-001',
                enrolled_by_key,
                COALESCE(enrolled_by_key, new.raw_user_meta_data->>'staff_key')
            )
            ON CONFLICT (user_id) DO NOTHING;
                
            RETURN NEW;
        EXCEPTION
            WHEN others THEN
                -- Log error but don't fail the entire transaction
                RAISE NOTICE 'Error creating license key: %', SQLERRM;
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

    // Create function to fix existing users without license keys
    const { error: fixUsersError } = await supabase.rpc('execute_admin_query', {
      query_text: `
        -- Create a function to repair missing license keys for existing users
        CREATE OR REPLACE FUNCTION public.repair_missing_license_keys()
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
            user_record RECORD;
            new_license_key TEXT;
            retry_count INTEGER;
        BEGIN
            -- Find all users without license keys
            FOR user_record IN 
                SELECT au.id, au.email, p.role, p.staff_key
                FROM auth.users au
                JOIN public.profiles p ON au.id = p.id
                LEFT JOIN public.license_keys lk ON au.id = lk.user_id
                WHERE lk.id IS NULL
            LOOP
                -- Generate a unique license key
                retry_count := 0;
                LOOP
                    new_license_key := public.generate_random_license_key();
                    
                    -- Exit when we find a unique key or hit max retries
                    EXIT WHEN NOT EXISTS (
                        SELECT 1 FROM public.license_keys 
                        WHERE license_key = new_license_key
                    ) OR retry_count >= 3;
                    
                    retry_count := retry_count + 1;
                END LOOP;
                
                -- Insert the license key record
                BEGIN
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
                        user_record.staff_key,
                        user_record.staff_key
                    );
                    
                    RAISE NOTICE 'Created license key for user %: %', user_record.id, new_license_key;
                EXCEPTION
                    WHEN others THEN
                        RAISE NOTICE 'Error creating license key for user %: %', user_record.id, SQLERRM;
                END;
            END LOOP;
        END;
        $$;
        
        -- Run the repair function to fix any missing license keys
        SELECT public.repair_missing_license_keys();
      `
    })

    if (fixUsersError) {
      console.error('Error creating repair function:', fixUsersError)
      return new Response(JSON.stringify({ 
        error: 'Failed to create repair function',
        details: fixUsersError
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }

    // Execute function to create license keys for profiles without them
    const { error: syncError } = await supabase.rpc('execute_admin_query', {
      query_text: `
        -- Fix the sync trigger for license keys to customer table
        CREATE OR REPLACE FUNCTION public.sync_license_key_to_customer()
        RETURNS trigger
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          -- Create or update the customer record based on license key
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
          VALUES (
            NEW.user_id, 
            COALESCE(NEW.name, 'Customer'),
            COALESCE(NEW.email, ''),
            COALESCE(NEW.phone, ''),
            COALESCE(NEW.status, 'Active'),
            '00000000-0000-0000-0000-000000000000'::uuid,
            COALESCE(NEW.staff_key, NEW.enrolled_by),
            '$0'
          )
          ON CONFLICT (id) 
          DO UPDATE SET
            name = COALESCE(EXCLUDED.name, customers.name),
            email = COALESCE(EXCLUDED.email, customers.email),
            phone = COALESCE(EXCLUDED.phone, customers.phone),
            status = COALESCE(EXCLUDED.status, customers.status),
            staff_key = COALESCE(EXCLUDED.staff_key, customers.staff_key),
            updated_at = NOW();
            
          RAISE NOTICE 'Synced license key to customer: %', NEW.user_id;
          RETURN NEW;
        EXCEPTION
          WHEN others THEN
            RAISE NOTICE 'Error syncing license key to customer: %', SQLERRM;
            RETURN NEW;
        END;
        $$;
      `
    })

    if (syncError) {
      console.error('Error updating sync_license_key_to_customer function:', syncError)
      return new Response(JSON.stringify({ 
        error: 'Failed to update sync function',
        details: syncError
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }

    return new Response(JSON.stringify({ 
      message: 'Database functions and triggers updated successfully. All users will now have license keys created automatically.'
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
