"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "../ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";
import { createClient } from "@/lib/supabase/supabaseClient";
import QRCode from "qrcode";
import { Clipboard, Check, AlertCircle } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";

interface SetupProps {
  closeModal: () => void; // Function to close the parent modal
  onSuccess: () => void;  // Function to call on successful 2FA setup
}

export function Setup({ closeModal, onSuccess }: SetupProps) {
  const [factorId, setFactorId] = useState<string>("");
  const [qr, setQR] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [verifyCode, setVerifyCode] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isPending, setIsPending] = useState(false); // For verification loading state
  const [isEnrolling, setIsEnrolling] = useState(true); // For initial enrollment loading state
  const [enrolled, setEnrolled] = useState(false); // True if factor is enrolled and QR/secret are generated
  const [copied, setCopied] = useState(false);

  const supabaseRef = useRef(createClient()); // Use useRef for a stable Supabase client instance
  const copiedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Optimized UUID generation using crypto API when available, with a fallback
  const generateUUID = useCallback((): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }, []);

  // Effect to enroll MFA when the component mounts
  useEffect(() => {

    const enrollMFA = async () => {
      try {
        setIsEnrolling(true); // Start loading state for enrollment
        setError(""); // Clear any previous errors

        const friendlyName = `Amrio CMS 2FA ${generateUUID()}`;
        console.log("Attempting to enroll MFA with friendly name:", friendlyName);

        // Supabase MFA enrollment call
        const enrollResult = await supabaseRef.current.auth.mfa.enroll({
          factorType: "totp",
          friendlyName
        });

        if (enrollResult.error || !enrollResult.data) {
          console.error("Supabase MFA enrollment error:", enrollResult.error);
          throw new Error(enrollResult.error?.message || "Enrollment failed");
        }

        const { id: factorId, totp } = enrollResult.data;
        console.log("MFA Enrollment successful. Factor ID:", factorId);
        console.log("TOTP URI from Supabase:", totp.uri); // *** IMPORTANT: Check this log for a valid URI ***

        if (!totp.uri) {
          throw new Error("TOTP URI is missing from enrollment data.");
        }

        // Generate QR code from the TOTP URI
        const qrCode = await QRCode.toDataURL(totp.uri, {
          width: 192,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        console.log("QR Code data URL generated successfully. Length:", qrCode.length); // *** IMPORTANT: Check this log for a non-empty data URL ***

        setFactorId(factorId);
        setQR(qrCode);
        setSecret(totp.secret);
        setEnrolled(true); // Mark as enrolled after QR code is generated and states are set
      } catch (err: any) {
        console.error("MFA enrollment and/or QR generation error:", err);
        setError(err.message || "Failed to set up 2FA. Please try again.");
      } finally {
        setIsEnrolling(false); // End loading state regardless of success or failure
      }
    };

    enrollMFA();

    // Cleanup function for useEffect: clears any pending timeouts when the component unmounts
    return () => {
      console.log("Setup component unmounting: Clearing copied timeout.");
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
        copiedTimeoutRef.current = null;
      }
    };
  }, [generateUUID]); // Empty dependency array ensures this runs once when Setup component mounts

  // Function to copy the secret code to clipboard
  const handleCopySecret = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);

      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
      copiedTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copiedTimeoutRef.current = null;
      }, 2000); // Reset "Copied!" message after 2 seconds
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      setError("Failed to copy to clipboard.");
    }
  }, [secret]);

  // Function to verify the 6-digit code entered by the user
  const handleVerify = useCallback(async () => {
    if (!verifyCode || verifyCode.length !== 6 || isPending) {
      console.log("Verification conditions not met (code empty, not 6 digits, or already pending).");
      return;
    }
    setError(""); // Clear previous errors
    setIsPending(true); // Start loading state for verification
    console.log("Attempting to verify MFA code...");
    try {
      // Step 1: Challenge the MFA factor
      const challengeResult = await supabaseRef.current.auth.mfa.challenge({ factorId });
      console.log("MFA Challenge result:", challengeResult);

      if (challengeResult.error || !challengeResult.data) {
        throw new Error(challengeResult.error?.message || "Failed to create challenge.");
      }
      const challengeId = challengeResult.data.id;

      // Step 2: Verify the code with the challenge ID
      const {error, data} = await supabaseRef.current.auth.mfa.verify({
        factorId,
        challengeId,
        code: verifyCode,
      });

      console.log("MFA Verification result:", data);

      if (error) {
        throw new Error(error.message || "Invalid verification code.");
      }

      console.log("MFA Verification successful!");
      onSuccess(); // Call the parent's success handler (which will also close the modal)
    } catch (err: any) {
      console.error("MFA verification error:", err);
      setError(err.message || "Verification failed. Please try again.");
      setVerifyCode(""); // Clear the input for re-entry on error
    } finally {
      setIsPending(false); // End loading state for verification
    }
  }, [verifyCode, isPending, factorId, onSuccess]);

  // Handle Enter key press on the OTP input to trigger verification
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && verifyCode.length === 6 && !isPending) {
      handleVerify();
    }
  }, [verifyCode, isPending, handleVerify]);

  const canVerify = verifyCode.length === 6 && !isPending && enrolled;
  const showError = error && !isEnrolling; // Only display error if not in the initial enrollment loading phase

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Setup Two-Factor Authentication</h2>
      </div>

      {showError && (
        <div className="flex items-center gap-2 text-red-500 mb-4 p-3 bg-red-50 rounded-md border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {isEnrolling ? (
        // Show loading spinner while enrolling
        <div className="flex flex-col items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-center text-gray-600">Setting up your 2FA...</p>
        </div>
      ) : enrolled && qr ? (
        // Show QR code and verification input if successfully enrolled and QR is available
        <div className="flex flex-col items-center space-y-4">
          <img
            src={qr}
            alt="MFA QR Code"
            className="w-48 h-48 border rounded-lg"
            // You can add loading="lazy" back here once confirmed working reliably
          />

          <div className="flex flex-col items-center w-full">
            <span className="font-medium text-sm text-gray-700">Manual Entry Code:</span>
            <div className="flex items-center gap-2 mt-2 bg-gray-50 px-3 py-2 rounded-md border border-gray-200 w-fit">
              <span className="font-mono text-sm select-all break-all" id="secret-code">
                {secret}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={copied ? "Copied!" : "Copy secret code"}
                    className="ml-2 p-1 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    onClick={handleCopySecret}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Clipboard className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {copied ? "Copied!" : "Copy to clipboard"}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <p className="text-sm text-gray-500 text-center max-w-sm">
            Scan the QR code with your authenticator app or manually enter the code above.
          </p>

          <div className="w-full">
            <label htmlFor="verify-code" className="block text-sm font-medium text-gray-700 mb-2">
              Enter the 6-digit code from your authenticator app:
            </label>
            <InputOTP
              maxLength={6}
              value={verifyCode}
              onChange={setVerifyCode}
              onKeyDown={handleKeyPress}
              className="w-full justify-center"
            >
              <InputOTPGroup>
                {[...Array(6)].map((_, i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>
      ) : (
        // Show a generic error message if enrollment failed and not currently loading
        <div className="flex flex-col items-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-center text-gray-600">Failed to generate 2FA setup. Please try again.</p>
        </div>
      )}

      <div className="flex justify-end space-x-2 mt-6">
        <Button
          variant="secondary"
          onClick={closeModal} // This calls the `handleCloseModal` prop from `Setup2fa`
          disabled={isPending}
        >
          Cancel
        </Button>
        {enrolled && ( // Only show the "Enable 2FA" button if enrollment was successful
          <Button
            onClick={handleVerify}
            disabled={!canVerify}
            className="min-w-[100px]"
          >
            {isPending ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Verifying...
              </div>
            ) : (
              "Enable 2FA"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}