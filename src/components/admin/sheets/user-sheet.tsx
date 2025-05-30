import { Sheet, SheetTitle, SheetHeader, SheetContent } from "@/components/ui/sheet";
import React from "react";
import UserCreationForm from "../forms/user-create-form";
import { UserFormValues } from "@/schemas/user-form";

interface UserSheetProps {
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
  initialData?: UserFormValues;
  user_id?: string;
}

export default function UserSheet({ sheetOpen, setSheetOpen, initialData, user_id }: UserSheetProps) {
  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{!!initialData ? "Edit user" : "Create new user"}</SheetTitle>
        </SheetHeader>

        <UserCreationForm
          onSuccess={() => {
            setSheetOpen(false);
          }}
          initialData={initialData}
          isEdit={!!initialData}
          user_id={user_id}
        />
      </SheetContent>
    </Sheet>  
  );
}
