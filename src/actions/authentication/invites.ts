"use server";

import { supabaseAdmin } from "@/lib/supabase/SupabaseAdminClient"; // Assumed to use SERVICE_ROLE_KEY
import { createClient } from "@/lib/supabase/supabaseServerClient"; // Assumed to use authenticated user's JWT
import { checkRequiredRoles } from "@/server/auth/check-required-roles";
import generateLink from "@/server/email/generateLink";
import { ActionResponse } from "@/types/actions";
import { render } from "@react-email/components";
import InviteUserEmail from "../../../emails/InviteUserEmail";
import { sendEmail } from "@/server/email/send-email";
import { generateRandomPassword } from "@/server/utils/generateRandomPassword";

interface UserFormValues {
  email: string;
  first_name: string;
  last_name: string;
  global_role_id: string; // This should be the UUID of the global_role_types entry
  send_invite: boolean;
}

export async function createUserInvite(
  userValues: UserFormValues,
): Promise<ActionResponse<void>> {
  const supabase = await createClient(); // Client for user-level operations (respects RLS)
  let newUserId: string | null = null; // To store the ID of the newly created auth user for cleanup

  try {
    // 1. Authorization Check: Ensure the calling user is a system_admin
    const { data: currentUser, error: currentUserError } = await supabase.auth.getUser();
    if (currentUserError || !currentUser) {
      return { success: false, error: "Unauthorized: User not authenticated." };
    }

    const isAdmin = await checkRequiredRoles(currentUser.user.id, ["system_admin"]);
    if (!isAdmin) {
      return { success: false, error: "Unauthorized: Only system administrators can create user invites." };
    }

    // 2. Check if the invitee user already exists in public.users
    const { data: existingUser, error: existingUserError } = await supabase
      .from("users")
      .select("id") // Only need ID to check existence
      .eq("email", userValues.email)
      .single();

    if (existingUserError && existingUserError.code !== "PGRST116") {
      // PGRST116 means "no rows found"
      console.error("Error checking for existing user:", existingUserError);
      return { success: false, error: "Failed to check for existing user." };
    }

    if (existingUser) {
      return { success: false, error: "User with this email already exists." };
    }

    // 3. Create user in auth.users (conditional based on send_invite)
    let inviteLink: string | null = null;

    if (userValues.send_invite) {
      // If sending an invite, use generateLink which creates user and sends email
      const { data: inviteData, error: generateLinkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "invite",
        email: userValues.email,
      });

      if (generateLinkError) {
        console.error("Error generating invite link:", generateLinkError);
        return { success: false, error: generateLinkError.message };
      }
      newUserId = inviteData.user.id;
      inviteLink = generateLink({
        next: "/onboarding", // Or your desired onboarding path
        token: inviteData.properties.hashed_token,
        type: "invite",
      });
    } else {
      // If NOT sending an invite, create user directly (no email sent by Supabase Auth)
      const generatedPassword = generateRandomPassword(); // Generate a temporary password
      const { data: createUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: userValues.email,
        password: generatedPassword,
        email_confirm: true, // Auto-confirm email for immediate use
      });

      if (createUserError) {
        console.error("Error creating user without invite:", createUserError);
        return { success: false, error: createUserError.message };
      }
      newUserId = createUserData.user.id;
      // Note: In this case, you'll need to securely store/provide the generatedPassword
      // to the user through another mechanism (e.g., an admin UI, or a separate password reset flow).
    }

    // Ensure newUserId is set before proceeding
    if (!newUserId) {
      return { success: false, error: "Failed to obtain new user ID after creation." };
    }

    // 4. Call the combined RPC function to create the profile and assign the role
    // This RPC handles inserting/updating public.users and inserting into user_global_roles.
    const { error: rpcError } = await supabaseAdmin.rpc("create_user_profile_and_assign_role", {
      p_user_id: newUserId,
      p_email: userValues.email,
      p_first_name: userValues.first_name,
      p_last_name: userValues.last_name,
      p_role_type_id: userValues.global_role_id, // Pass the UUID of the role type
    });

    if (rpcError) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return { success: false, error: `Failed to set up user profile and role: ${rpcError.message}` };
    }

    // 5. Send invite email if requested (only if inviteLink was generated)
    if (userValues.send_invite && inviteLink) {
      try {
        const emailHtml = await render(
          InviteUserEmail({
            yourName: "Amrio", // Replace with dynamic sender name if needed
            setupLink: inviteLink,
            clientName: userValues.email, // Or userValues.first_name
          })
        );
        await sendEmail(userValues.email, "Invite to Amrio CMS", "Invite to Amrio CMS", emailHtml);
      } catch (emailError) {
        console.error("Error sending invite email:", emailError);
        // Decide if email sending failure should fail the whole process.
        // For now, we'll return success as user and role are created in DB.
      }
    }

    return { success: true };
  } catch (overallError: any) {
    console.error("An unexpected error occurred in createUserInvite:", overallError);
    // Attempt to clean up auth user if created but something else failed
    if (newUserId) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId).catch((cleanUpErr) => {
        console.error("Error during cleanup of auth user:", cleanUpErr);
      });
    }
    return { success: false, error: overallError.message || "An unknown error occurred." };
  }
}
