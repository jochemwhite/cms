'use server';

import { supabaseAdmin } from "@/lib/supabase/SupabaseAdminClient";
import { Database } from "@/types/supabase";

export async function checkRequiredRoles(userId: string, requiredRoles: Database["public"]["Enums"]["app_role"][]): Promise<boolean> {
  const { data: user, error: userError } = await supabaseAdmin.from('cms_user_roles').select('role').eq('user_id', userId)

  if (userError || !user) {
    return false;
  }

  const userRoles = user.map((user) => user.role);

  return requiredRoles.every((role) => userRoles.includes(role));

}