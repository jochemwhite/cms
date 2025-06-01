"use client";

import supabase from "@/lib/supabase/supabaseClient";
import { ShieldCheck } from "lucide-react";
import React, { useEffect, useState } from "react";
import Setup2fa from "./setup-2fa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

export default function MultifactorAuthentication() {
  const [isMfaVerified, setIsMfaVerified] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const checkMfaStatus = async () => {
      try {
        const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();

        if (error) {
          console.error(error);
          setError(true);
          return;
        }

        setIsMfaVerified(data.currentLevel === "aal2" && data.nextLevel === "aal2");
      } catch (err) {
        console.error(err);
        setError(true);
      }
    };

    checkMfaStatus();
  }, []);

  if (error) {
    return <>something went wrong</>;
  }

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
