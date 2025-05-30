"use server";

import { supabaseAdmin } from "@/lib/supabase/SupabaseAdminClient";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { UserFormValues } from "@/schemas/user-form";
import { uploadProfileImage } from "@/server/utils/upload-profile-image";
import { ActionResponse } from "@/types/actions";
import { revalidatePath } from "next/cache";

export async function updateUser(formData: Partial<UserFormValues>): Promise<ActionResponse<void>> {
  const supabase = await createClient();
  const { data: currentUser, error: currentUserError } = await supabase.auth.getUser();
  if (currentUserError || !currentUser) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  const { data, error } = await supabase.from("users").update(formData).eq("id", currentUser.user.id);

  if (error) {
    console.error(error);
    return { success: false, error: error.message };
  }

  // insert audit log
  await supabaseAdmin.from("audit_logs").insert({
    event_type: "update_user",
    user_id: currentUser.user.id,
    target_user_id: currentUser.user.id,
    metadata: { formData },
    ip_address: null,
    user_agent: null,
  });

  revalidatePath("/dashboard/", "layout");

  return { success: true };
}

// update user profile image
export async function updateUserProfileImage(file: any): Promise<ActionResponse<string>> {
  const supabase = await createClient();
  const { data: currentUser, error: currentUserError } = await supabase.auth.getUser();
  if (currentUserError || !currentUser) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  const isFileLike = (obj: any) =>
    obj && typeof obj === "object" && typeof obj.name === "string" && typeof obj.type === "string" && typeof obj.size === "number";

  let url: string | undefined;

  if (isFileLike(file)) {
    const result = await uploadProfileImage(currentUser.user.id, file);
    if (result.error) {
      return { success: false, error: result.error };
    }
    url = result.url;
  }

  return { success: true, data: url };
}


// update user password
export async function updateUserPassword( currentPassword: string, newPassword: string): Promise<ActionResponse<void>> {
  const supabase = await createClient();
  const { data: currentUser, error: currentUserError } = await supabase.auth.getUser();
  if (currentUserError || !currentUser) {
    
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: currentUser.user.email!,
    password: currentPassword,
  });

  if (signInError) {
    return { success: false, error: signInError.message };
  }

  // update password
  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  
  
  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}