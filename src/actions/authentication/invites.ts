'use server';

import { supabaseAdmin } from "@/lib/supabase/SupabaseAdminClient";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { checkRequiredRoles } from "@/server/auth/check-required-roles";
import generateLink from "@/server/email/generateLink";
import { ActionResponse } from "@/types/actions";

export async function createUserInvite(email: string): Promise<ActionResponse<void>> {
  const supabase = await createClient();

  // check if the user is authorized to create an invite
  const { data: user, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: "Unauthorized" };
  }

  // check if the user is an admin
  const isAdmin = await checkRequiredRoles(user.user.id, ['system_admin']);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  // create an invite
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "invite",
    email: email,
  });

  if (error) {
    return {
      success: false,
      error: error.message, 
    };
  }
// create the redirect url
  const url: string = generateLink({
    next: "/onboarding",
    token: data.properties.hashed_token,
    type: "invite",
  });


  // send an email to the user with the invite link

  return { success: true };



  
}