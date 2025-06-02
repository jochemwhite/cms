import { useState } from "react";
import { verifyMfaAction } from "@/app/(auth)/_actions";
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface AuthMFAProps {
  onSuccess: () => void;
}

export default function AuthMFA({ onSuccess }: AuthMFAProps) {
  const [verifyCode, setVerifyCode] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const onSubmitClicked = async () => {
    setError("");
    setIsPending(true);
    const result = await verifyMfaAction(verifyCode);
    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || "Failed to verify MFA");
    }
    setIsPending(false);
  };

  return (
    <Card className="max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">Please enter the code from your authenticator app.</div>
        <div className="mb-4">
          <Label htmlFor="mfa-code">2FA Code</Label>
          <InputOTP id="mfa-code" value={verifyCode} onChange={setVerifyCode} autoFocus maxLength={6} className="mt-2">
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSeparator />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        {error && <div className="text-red-500 mb-2">{error}</div>}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={onSubmitClicked} disabled={isPending || verifyCode.length !== 6}>
          {isPending ? "Verifying..." : "Submit"}
        </Button>
      </CardFooter>
    </Card>
  );
}
