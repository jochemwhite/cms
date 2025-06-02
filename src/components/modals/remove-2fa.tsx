import React, { useState } from "react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { createClient } from "@/lib/supabase/supabaseClient";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function Remove2fa({ open, onOpenChange, onSuccess }: Props) {
  const supabase = createClient();

  const handleDelete = async () => {
    await handleRemove2FA();
    onOpenChange(false);
  };

  const handleRemove2FA = async () => {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    if (factors?.totp) {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: factors.totp[0].id });
      if (error) {
        console.error(error);
      }
    }
    const { data: { session } } = await supabase.auth.refreshSession();
    if (session) {
      onSuccess();
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Confirm Delete"
      description={`Are you sure you want to remove two-factor authentication (2FA)? This will make your account less secure. `}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Remove 2FA
          </Button>
        </div>
      }
      contentClassName="max-w-sm"
    >
      <div className="py-2">This will remove 2FA from your account.</div>
    </Modal>
  );
}
