import ResetPassword from "@/components/auth/reset-password";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { redirect } from "next/navigation";
import React from "react";

export default async function UpdatePasswordPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/");
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <ResetPassword />
    </div>
  );
}
