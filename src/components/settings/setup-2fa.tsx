"use client";

import React, { useState, useCallback } from "react";
import { Button } from "../ui/button";
import { Modal } from "../ui/modal"; // Assuming this is your modal component
import { Setup } from "./setup"; // Import the new Setup component

interface Setup2faProps {
  onSuccess: () => void;
}

export default function Setup2fa({ onSuccess }: Setup2faProps) {
  const [open, setOpen] = useState(false);

  const handleSetupSuccess = useCallback(() => {
    console.log("handleSetupSuccess");
    setOpen(false);
    onSuccess();
  }, [onSuccess]);

  const handleCloseModal = useCallback(() => {
    setOpen(false); // Close the modal
  }, []);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Setup 2FA</Button>
      <Modal
        open={open}
        onOpenChange={setOpen} // Keeps the modal's open state in sync
        title="Enroll MFA"
        description="Protect your account with two-factor authentication"
      >
        {open && <Setup closeModal={handleCloseModal} onSuccess={handleSetupSuccess} />}
      </Modal>
    </>
  );
}
