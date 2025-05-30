"use client";

import { useModal } from "@/providers/modal-provider";
import React, { useEffect, useState, useTransition } from "react";
import { Button } from "../ui/button";
import { enrollMFA, verifyMFA } from "@/actions/sign-in"; // Assuming these are in "@/actions/sign-in"
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Input } from "../ui/input";
import { createClient } from "@/lib/supabase/supabaseClient"; // Assuming you have createClient defined

export default function Setup2fa() {
  const { openModal, closeModal } = useModal();

  const modal = () => {
    openModal(<Setup closeModal={closeModal} />);
  };

  return <Button onClick={modal}>Setup 2FA</Button>;
}

interface props {
  closeModal: () => void;
}

const Setup = ({ closeModal }: props) => {
  const [isPending, startTransition] = useTransition();
  const [factorId, setFactorId] = useState<string>("");
  const [qr, setQR] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [verifyCode, setVerifyCode] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleEnroll = async () => {
    setError("");
    try {
      const data = await enrollMFA();
      setFactorId(data.factorId);
      setQR(data.qr);
      setSecret(data.secret);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Verify the user-provided code.
  const handleVerify = async () => {
    setError("");
    try {
      await verifyMFA({ factorId, verifyCode });

      // **ADD REFRESH SESSION HERE**
      const supabase = await createClient(); // Ensure createClient() is available here
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error("Error refreshing session:", refreshError);
        setError(`Error refreshing session: ${refreshError.message}`); // Set error state  
      }     

      // Close the modal on successful verification AND session refresh.
      closeModal();
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    handleEnroll();
  }, []);

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <h2 className="text-xl font-bold">Enroll MFA</h2>
      </CardHeader>
      <CardContent>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {qr ? (
          <div className="flex flex-col items-center">
            <img src={qr} alt="MFA QR Code" className="w-48 h-48" />
            <div className="mt-2">
              <span className="font-medium">Secret Code: </span>
              <span>{secret}</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">Scan the QR code or manually enter the secret into your authenticator app.</p>
            <Input placeholder="Enter verification code" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.trim())} className="mt-4" />
          </div>
        ) : (
          <p className="text-center">Click &quot;Start Enrollment&quot; to generate your MFA setup details.</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button onClick={() => startTransition(handleVerify)} disabled={isPending}>
          {isPending ? "Verifying..." : "Enable"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => closeModal()} 
        >
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
};
