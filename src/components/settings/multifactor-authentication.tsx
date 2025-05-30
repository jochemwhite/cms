import { ShieldCheck } from "lucide-react";
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { createClient } from "@/lib/supabase/supabaseClient";
import Setup2fa from "./setup-2fa";

export default async function MultifactorAuthentication() {
  const supabase = createClient();

  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (error) {
    console.error(error);
    return <>something went wrong</>
  }



  if (data) console.log(data);

  const isMfaVerified = data.currentLevel === "aal2" && data.nextLevel === "aal2";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Security</CardTitle>
        <CardDescription>Protect your account with two-factor authentication</CardDescription>
      </CardHeader>
      <CardContent>{isMfaVerified ? <div>Status: MFA is active and verified.</div> : <Setup2fa />}</CardContent>
    </Card>
  );
}
