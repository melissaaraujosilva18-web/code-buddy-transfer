import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserData {
  id: string;
  email: string;
  full_name: string;
  balance: number;
  has_deposited: boolean;
  bonus_claimed: boolean;
  pix_key: string | null;
  withdrawal_status: string | null;
  withdrawal_amount: number;
  pix_key_type: string | null;
  pix_name: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { users, roles } = await req.json();

    console.log(`Importing ${users.length} users...`);

    const results = {
      success: [] as string[],
      failed: [] as string[],
    };

    // Map to store old user_id -> new user_id
    const userIdMap = new Map<string, string>();

    for (const userData of users) {
      try {
        // Create user in auth.users with admin API
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: 'TempPass@123', // Temporary password
          email_confirm: true,
          user_metadata: {
            full_name: userData.full_name
          }
        });

        if (authError) {
          console.error(`Failed to create auth user for ${userData.email}:`, authError);
          results.failed.push(userData.email);
          continue;
        }

        console.log(`Created auth user: ${userData.email}`);

        // Store the mapping of old ID to new ID
        userIdMap.set(userData.id, authUser.user.id);

        // Update the profile with imported data
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            balance: userData.balance,
            has_deposited: userData.has_deposited,
            bonus_claimed: userData.bonus_claimed,
            pix_key: userData.pix_key,
            withdrawal_status: userData.withdrawal_status,
            withdrawal_amount: userData.withdrawal_amount,
            pix_key_type: userData.pix_key_type,
            pix_name: userData.pix_name
          })
          .eq('id', authUser.user.id);

        if (updateError) {
          console.error(`Failed to update profile for ${userData.email}:`, updateError);
          results.failed.push(userData.email);
          continue;
        }

        console.log(`Updated profile for: ${userData.email}`);
        results.success.push(userData.email);
      } catch (error) {
        console.error(`Error processing ${userData.email}:`, error);
        results.failed.push(userData.email);
      }
    }

    // Import roles using the new user IDs
    if (roles && roles.length > 0) {
      for (const role of roles) {
        const newUserId = userIdMap.get(role.user_id);

        if (!newUserId) {
          console.error(`Could not find new user ID for old ID: ${role.user_id}`);
          continue;
        }

        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: newUserId,
            role: role.role
          });

        if (roleError) {
          console.error('Failed to insert role:', roleError);
        } else {
          console.log(`Inserted role ${role.role} for user ${newUserId}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Import completed',
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
