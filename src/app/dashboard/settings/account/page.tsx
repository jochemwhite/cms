import { ImageSection } from "@/components/settings/image-settings";
import MultifactorAuthentication from "@/components/settings/multifactor-authentication";
import { PasswordSection } from "@/components/settings/password-settings";
import { ProfileSection } from "@/components/settings/profile-settings";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { unauthorized } from "next/navigation";
import React, { use } from "react";

export const metadata = {
  title: "Account Settings | Amrio",
  description: "Manage your account settings, profile information, and security preferences",
};

export default async function page() {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    unauthorized();
  }

  if (!userData.user) {
    unauthorized();
  }

  const { data, error } = await supabase.from("users").select("*").eq("id", userData.user.id).single();

  if (error) {
    console.log(error);
    return unauthorized();
  }

  return (
    <div className="container px-4 py-8 mx-auto max-w-6xl">
      <div className="grid gap-6 md:gap-8">
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          <ProfileSection user={data} staggerIndex={0} />
          <ImageSection user={data} staggerIndex={1} />
        </div>

        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          <PasswordSection staggerIndex={2} />
          <MultifactorAuthentication  />
        </div>
      </div>
    </div>
  );
}
