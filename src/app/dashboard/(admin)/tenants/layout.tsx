import { createClient } from "@/lib/supabase/supabaseServerClient";
import { unauthorized } from "next/navigation";
import React from "react";

export default async function layout({ children }: { children: React.ReactNode }) {
  // check if the user is a system admin
  const supabase = await createClient();

  const { data, error } = await supabase.from("cms_user_roles").select("*").eq("role", "system_admin").single();

  if (error) {
    unauthorized();
  }

  return <div>{children}</div>;
}
