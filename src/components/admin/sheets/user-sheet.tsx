import { Sheet, SheetTitle, SheetHeader, SheetContent } from "@/components/ui/sheet";
import React from "react";
import UserCreationForm from "../forms/UserCreationForm";
import { UserFormValues } from "@/schemas/user-form";

interface UserSheetProps {
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
  initialData?: UserFormValues;
  isEdit?: boolean;
  id?: string;
}

export default function UserSheet({ sheetOpen, setSheetOpen, initialData, isEdit, id }: UserSheetProps) {
  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create new user</SheetTitle>
        </SheetHeader>

        <UserCreationForm
          onSuccess={() => {
            setSheetOpen(false);
          }}
          initialData={initialData}
        />
      </SheetContent>
    </Sheet>  
  );
}
