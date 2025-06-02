"use client";

import { createClient } from "@/lib/supabase/supabaseClient";
import { ShieldCheck } from "lucide-react";
import React, { useEffect, useState } from "react";
import Setup2fa from "./setup-2fa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import Remove2fa from "../modals/remove-2fa";
import { useUserSession } from "@/providers/session-provider";

export default function MultifactorAuthentication() { 
  const [isMfaVerified, setIsMfaVerified] = useState(false);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const { userSession } = useUserSession();
  const supabase = createClient();
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

        console.log(data, factors);
        setIsMfaVerified(data.currentLevel === "aal2" && data.nextLevel === "aal2");
      } catch (err) {
        console.error(err);
        setError(true);
      }
    };

    checkMfaStatus();
  }, [userSession, isMfaVerified]);

  const handleRemove2FA = () => {
    setOpen(true);
  };
  if (error) {
    return <>something went wrong</>;
  }

  return (
    <Card className="overflow-hidden border border-border/40 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold tracking-tight">Account Security</CardTitle>
        <CardDescription className="text-muted-foreground">
          Protect your account with two-factor authentication
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isMfaVerified ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4 dark:bg-green-950/50">
              <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-green-700 dark:text-green-300">
                Two-factor authentication is enabled and active
              </span>
            </div>
            <Button
              variant="destructive"
              onClick={handleRemove2FA}
            >
              Remove 2FA
            </Button>
          </div>
        ) : (
          <Setup2fa onSuccess={() => {
            setIsMfaVerified(true);
          }} />
        )}
      </CardContent>
      <Remove2fa open={open} onOpenChange={setOpen} onSuccess={() => {
        setIsMfaVerified(false);
      }} />
    </Card>
  );
}
