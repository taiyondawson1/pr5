import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    // Run the cleanup function
    const { data, error } = await supabase.rpc('cleanup_orphaned_account_data')

    if (error) {
      console.error("Error cleaning up orphaned account data:", error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Cleanup failed: " + error.message 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      )
    }

    console.log("Orphaned account data cleanup completed. Deleted records:", data)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Orphaned account data cleanup completed",
        deletedCount: data
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    )

  } catch (error) {
    console.error("Exception during cleanup:", error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Internal server error: " + error.message 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    )
  }
})
