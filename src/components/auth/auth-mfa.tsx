

import { useState } from "react";
import { createClient } from "@/lib/supabase/supabaseClient";
import { verifyMfaAction } from "@/app/(auth)/_actions";

interface AuthMFAProps {
  onSuccess: () => void;
}

export default function AuthMFA({ onSuccess }: AuthMFAProps) {
  const [verifyCode, setVerifyCode] = useState("");
  const [error, setError] = useState("");

  const onSubmitClicked = async () => {
    setError("");
    const result = await verifyMfaAction(verifyCode);
    if (result.success) {
      console.log("MFA verified");
      onSuccess();
    } else {
      setError(result.error || "Failed to verify MFA");
      console.error(result.error);
    }
  };

  return (
    <>
      <div>Please enter the code from your authenticator app.</div>
      {error && <div className="error">{error}</div>}
      <input type="text" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.trim())} />
      <button type="button" onClick={onSubmitClicked}>
        Submit
      </button>
    </>
  );
}
