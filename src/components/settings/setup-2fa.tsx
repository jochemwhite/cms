"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Modal } from "../ui/modal";
import { Input } from "../ui/input";
import { createClient } from "@/lib/supabase/supabaseClient";
import QRCode from "qrcode"; // add at the top


interface Props {
  onSuccess: () => void;
}

export default function Setup2fa({ onSuccess }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Setup 2FA</Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Enroll MFA"
        description="Protect your account with two-factor authentication"
      >
        <Setup closeModal={() => setOpen(false)} onSuccess={onSuccess}  />
      </Modal>
    </>
  );
}

interface SetupProps {
  closeModal: () => void;
  onSuccess: () => void;
}

const Setup = ({ closeModal, onSuccess }: SetupProps) => {
  const [factorId, setFactorId] = useState<string>("");
  const [qr, setQR] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [verifyCode, setVerifyCode] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isPending, setIsPending] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const supabase = createClient();

  // Helper to generate a UUID (client-side)
  function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Automatically enroll MFA when component mounts (client-side)
  React.useEffect(() => {
    const enrollAndChallenge = async () => {
      try {
        const friendlyName = `Amrio CMS 2FA`;
        const enrollResult = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName });
        if (enrollResult.error || !enrollResult.data) {
          setError(enrollResult.error?.message || "Enrollment failed");
          return;
        }
        const { id: factorId, totp } = enrollResult.data;
        setFactorId(factorId);
        const qrCode = await QRCode.toDataURL(totp.uri);
        setQR(qrCode);
        setSecret(totp.secret);
        setEnrolled(true);
      } catch (err: any) {
        setError(err.message);
      }
    };
    enrollAndChallenge();
  }, []);

  // Verify the user-provided code using the supabase-js client
  const handleVerify = async () => {
    setError("");
    setIsPending(true);
    try {
      // Call challenge right before verify
      const challengeResult = await supabase.auth.mfa.challenge({ factorId });
      if (challengeResult.error || !challengeResult.data) {
        setError(challengeResult.error?.message || "Challenge failed");
        setIsPending(false);
        return;
      }
      const challengeId = challengeResult.data.id;

      // Now verify
      const verifyResult = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: verifyCode,
      });
      if (verifyResult.error) {
        setError(verifyResult.error.message || "Verification failed");
        setIsPending(false);
        return;
      }
      onSuccess();
      closeModal();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Enroll MFA</h2>
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {enrolled && qr ? (
        <div className="flex flex-col items-center">
          <img src={qr} alt="MFA QR Code" className="w-48 h-48" />
          <div className="mt-2">
            <span className="font-medium">Secret Code: </span>
            <span>{secret}</span>
          </div>
          <p className="mt-2 text-sm text-gray-500">Scan the QR code or manually enter the secret into your authenticator app.</p>
          <Input
            placeholder="Enter verification code"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.trim())}
            className="mt-4"
          />
        </div>
      ) : (
        <p className="text-center">Generating your MFA setup details...</p>
      )}
      <div className="flex justify-end space-x-2 mt-6">
        {enrolled ? (
          <Button onClick={handleVerify} disabled={isPending || !verifyCode}>
            {isPending ? "Verifying..." : "Enable"}
          </Button>
        ) : null}
        <Button variant="secondary" onClick={closeModal}>
          Cancel
        </Button>
      </div>
    </div>
  );
};
