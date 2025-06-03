"use server";

import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/SupabaseAdminClient";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { OnboardingFormValues } from "@/schemas/onboarding-form";
import { UserFormValues } from "@/schemas/user-form";
import { checkRequiredRoles } from "@/server/auth/check-required-roles";
import generateLink from "@/server/email/generateLink";
import { sendEmail } from "@/server/email/send-email";
import { ActionResponse } from "@/types/actions";
import { Database } from "@/types/supabase";
import { render } from "@react-email/components";
import { SupabaseClient, User } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import ResetPasswordEmail from "../../../emails/ResetPassword";
import InviteUserEmail from "../../../emails/InviteUserEmail";
import { uploadProfileImage } from "@/server/utils/upload-profile-image";

// delete user
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

    // Insert audit log
    await supabaseAdmin.from("audit_logs").insert({
      event_type: "admin_delete_user",
      user_id: currentUser.user.id,
      target_user_id: user_id,
      ip_address: null, // Optionally, get from request headers if available
      user_agent: null, // Optionally, get from request headers if available
    });

    revalidatePath("/dashboard/admin/users", "layout");
    return { data: data.user, success: true };
  } catch (err) {
    console.error(err);
    return { error: err instanceof Error ? err.message : "Unknown error", success: false };
  }
}

// update user
export async function UpdateUser(user_id: string, formData: Partial<UserFormValues>): Promise<ActionResponse<void>> {
  const supabase = await createClient();
  // check if user is admin
  const { data: currentUser, error: currentUserError } = await supabase.auth.getUser();
  if (currentUserError || !currentUser) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }
  const hasPermission = await checkRequiredRoles(currentUser.user.id, ["system_admin"]);
  if (!hasPermission) {
    return { success: false, error: "User does not have permission to update users" };
  }

  // update user
  const { data, error } = await supabaseAdmin
    .from("users")
    .update({
      first_name: formData.first_name,
      last_name: formData.last_name,
    })
    .eq("id", user_id);
  if (error) {
    console.error(error);
    return { success: false, error: error.message };
  }

  // update user roles
  const { data: rolesData, error: rolesError } = await supabaseAdmin
    .from("user_global_roles")
    .update({
      global_role_type_id: formData.global_role,
    })
    .eq("user_id", user_id);
  if (rolesError) {
    console.error(rolesError);
  }

  // insert audit log
  await supabaseAdmin.from("audit_logs").insert({
    event_type: "admin_update_user",
    user_id: currentUser.user.id,
    target_user_id: user_id,
    metadata: {
      ...formData,
    },
    ip_address: null,
    user_agent: null,
  });

  revalidatePath("/dashboard/admin/users", "layout");
  return { success: true };
}

// update user role
export async function UpdateUserRole(user_id: string, role_id: string): Promise<ActionResponse<void>> {
  const supabase = await createClient();

  // check if user is admin
  const { data: currentUser, error: currentUserError } = await supabase.auth.getUser();
  if (currentUserError || !currentUser) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }
  const hasPermission = await checkRequiredRoles(currentUser.user.id, ["system_admin"]);
  if (!hasPermission) {
    return { success: false, error: "User does not have permission to update user roles" };
  }
  const { data, error } = await supabaseAdmin
    .from("user_global_roles")
    .update({
      global_role_type_id: role_id,
    })
    .eq("user_id", user_id);

  if (error) {
    console.error(error);
    return { success: false, error: error.message };
  }

  // insert audit log
  await supabaseAdmin.from("audit_logs").insert({
    event_type: "admin_update_user_role",
    user_id: currentUser.user.id,
    target_user_id: user_id,
    metadata: { role_id },
    ip_address: null,
    user_agent: null,
  });

  revalidatePath("/dashboard/admin/users", "layout");
  return { success: true };
}

// send password reset email
export async function SendPasswordResetEmail(email: string): Promise<ActionResponse<void>> {
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
      return { success: false, error: "User does not have permission to send password reset emails" };
    }

    // create password reset token
    const { data: inviteData, error: generateLinkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
    });
    if (generateLinkError) {
      console.error("Error generating invite link:", generateLinkError);
      return { success: false, error: generateLinkError.message };
    }
    if (!inviteData) {
      return { success: false, error: "Failed to generate password reset token" };
    }
    // create password reset link
    const link = generateLink({
      next: "/auth/update-password",
      token: inviteData.properties.hashed_token,
      type: "recovery",
    });

    // send email
    const emailHtml = await render(
      ResetPasswordEmail({
        yourName: "Amrio",
        resetLink: link,
        userName: inviteData.user.email || "",
      })
    );

    const { success, error } = await sendEmail({
      to: email,
      subject: "Password Reset Request",
      text: "Password Reset Request",
      html: emailHtml,
    });

    if (!success) {
      return { success: false, error: error || "Failed to send password reset email" };
    }

    // Insert audit log
    await supabaseAdmin.from("audit_logs").insert({
      event_type: "admin_password_reset_email",
      user_id: currentUser.user.id,
      target_user_id: inviteData.user.id,
      metadata: { email },
      ip_address: null, // Optionally, get from request headers if available
      user_agent: null, // Optionally, get from request headers if available
    });

    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: err instanceof Error ? err.message : "Unknown error", success: false };
  }
}

// resend onboarding email
export async function ResendOnboardingEmail(user_id: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient();

    // check if user is admin
    const { data: currentUser, error: currentUserError } = await supabase.auth.getUser();
    if (currentUserError || !currentUser) {
      return { success: false, error: "Unauthorized: User not authenticated." };
    }
    const hasPermission = await checkRequiredRoles(currentUser.user.id, ["system_admin"]);
    if (!hasPermission) {
      return { success: false, error: "User does not have permission to resend onboarding emails" };
    }

    // get user
    const { data: user, error: userError } = await supabaseAdmin.from("users").select("*").eq("id", user_id).single();
    if (userError) {
      console.error(userError);
      return { success: false, error: userError.message };
    }

    const { data: inviteData, error: generateLinkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink", 
      email: user.email,
    });

    if (generateLinkError) {
      console.error("Error generating invite link:", generateLinkError);
      return { success: false, error: generateLinkError.message };
    }
    const inviteLink = generateLink({
      next: "/onboarding", 
      token: inviteData.properties.hashed_token,
      type: "magiclink",
    });

    try {
      const emailHtml = await render(
        InviteUserEmail({
          yourName: "Amrio", // Replace with dynamic sender name if needed
          setupLink: inviteLink,
          clientName: user.email, // Or userValues.first_name
        })
      );
      await sendEmail({
        to: user.email,
        subject: "Invite to Amrio CMS",
        text: "Invite to Amrio CMS",
        html: emailHtml,
      });
    } catch (emailError) {
      console.error("Error sending invite email:", emailError);
      throw emailError;
    }

    return { success: true };
  } catch (error) {
    console.error("Error in ResendOnboardingEmail:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "An unknown error occurred"
    };
  }
}

// update user onboarding status
export async function UpdateUserOnboardingStatus(user_id: string, formData: OnboardingFormValues): Promise<ActionResponse<void>> {
  const supabase = await createClient();
  try {
    let profileImageUrl: string | undefined;

    const isFileLike = (obj: any) =>
      obj && typeof obj === "object" && typeof obj.name === "string" && typeof obj.type === "string" && typeof obj.size === "number";

    if (isFileLike(formData.profileImage)) {
      const result = await uploadProfileImage(user_id, formData.profileImage);
      if (result.error) {
        return { success: false, error: result.error };
      }
      profileImageUrl = result.url;
    }

    // Prepare update object
    const updateObj: Database["public"]["Tables"]["users"]["Update"] = {
      is_onboarded: true,
      first_name: formData.firstname,
      last_name: formData.lastname,
    };
    if (profileImageUrl) {
      updateObj.avatar = profileImageUrl;
    }

    // Update user profile
    const { error: userUpdateError } = await supabase.from("users").update(updateObj).eq("id", user_id);

    if (userUpdateError) {
      console.error(userUpdateError);
      return { success: false, error: userUpdateError.message };
    }

    // // Update password if provided
    if (formData.password && formData.password.length > 0) {
      const { error: passwordUpdateError } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (passwordUpdateError) {
        console.error(passwordUpdateError);
        return { success: false, error: passwordUpdateError.message };
      }
    }

    // Insert audit log
    await supabaseAdmin.from("audit_logs").insert({
      event_type: "user_onboarding_completed",
      user_id,
      metadata: {
        first_name: formData.firstname,
        last_name: formData.lastname,
        avatar: profileImageUrl || null,
      },
      ip_address: null,
      user_agent: null,
    });

    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: err instanceof Error ? err.message : "Unknown error", success: false };
  }
}

// forgot password
export async function ForgotPassword(email: string): Promise<ActionResponse<void>> {
  const supabase = await createClient();
  try {
    // check if the user exists
    const { data: user, error: userError } = await supabaseAdmin.from("users").select("*").eq("email", email).single();
    if (userError) {
      if (userError.code === "PGRST116") {
        // add to audit log
        await supabaseAdmin.from("audit_logs").insert({
          event_type: "user_forgot_password",
          user_id: null,
          metadata: { email },
          ip_address: null,
          user_agent: null,
        });
        return { success: true };
      }
      return { success: false, error: userError.message };
    }

    // generate password reset link
    const { data: inviteData, error: generateLinkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
    });

    if (generateLinkError) {
      console.error("Error generating password reset link:", generateLinkError);
      return { success: false, error: generateLinkError.message };
    }

    const link = generateLink({
      next: "/password-reset",
      token: inviteData.properties.hashed_token,
      type: "recovery",
    });

    // send email
    const emailHtml = await render(
      ResetPasswordEmail({
        yourName: "Amrio",
        resetLink: link,
        userName: user.email,
      })
    );
    
    const { success, error } = await sendEmail({
      to: email,
      subject: "Password Reset Request",
      text: "Password Reset Request",
      html: emailHtml,
    });



    if (!success) {
      return { success: false, error: error || "Failed to send password reset email" };
    }

    // insert audit log
    await supabaseAdmin.from("audit_logs").insert({
      event_type: "user_forgot_password",
      user_id: user.id,
      metadata: { email },
    });

    // logout user
    await supabase.auth.signOut();

    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: err instanceof Error ? err.message : "Unknown error", success: false };
  }
}

// reset password
export async function ResetPassword(password: string): Promise<ActionResponse<void>> {
  const supabase = await createClient();
  try {
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error(userError);
      return { success: false, error: userError.message };
    }

    const { error: passwordUpdateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (passwordUpdateError) {
      console.error(passwordUpdateError);
      return { success: false, error: passwordUpdateError.message };
    }


    // logout user
    await supabase.auth.signOut();

    // add to audit log
    await supabaseAdmin.from("audit_logs").insert({
      event_type: "user_password_reset",
      user_id: user.user?.id,
      metadata: { password },
    });

    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: err instanceof Error ? err.message : "Unknown error", success: false };
  }
}