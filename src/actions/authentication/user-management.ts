"use server";

import { supabaseAdmin } from "@/lib/supabase/SupabaseAdminClient";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { checkRequiredRoles } from "@/server/auth/check-required-roles";
import { ActionResponse } from "@/types/actions";
import { User } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function DeleteUser(user_id: string): Promise<ActionResponse<User | null>> {
  const supabase = await createClient();
  try {
    // get current user
    const { data: currentUser, error: currentUserError } = await supabase.auth.getUser();
    if (currentUserError || !currentUser) {
      return { success: false, error: "Unauthorized: User not authenticated." };
    }   
    
    // check if user is admin
    const hasPermission = await checkRequiredRoles(currentUser.user.id, ["system_admin"]);
    
    if (!hasPermission) {
      return { error: "User does not have permission to delete users", success: false };
    }
    
    // delete user
    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(user_id);

    if (error) {
      console.error(error);
      throw new Error(error.message);
    }
    revalidatePath("/dashboard/admin/users", "layout");
    return { data: data.user, success: true };
  } catch (err) {
    console.error(err);
    return { error: err instanceof Error ? err.message : "Unknown error", success: false };
  }
}
