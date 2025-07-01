"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import UserSheet from "../sheets/user-sheet";

interface OpenUserSheetProps {
  label?: string;
}

export default function OpenUserSheetButton({ label = "Add User" }: OpenUserSheetProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setSheetOpen(true)}>
        {label}
      </Button>
      <UserSheet sheetOpen={sheetOpen} setSheetOpen={setSheetOpen} onSuccess={() => setSheetOpen(false)} />
    </>
  );
}
