"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useUsers } from "@/providers/users-providers";
import { UserForProvider } from "@/types/custom-supabase-types";
import { Copy, Edit, Mail, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import DeleteUserModal from "../../modals/delete-user-modal";
import UserSheet from "../../sheets/user-sheet";

export default function UserTableActions({ user, canEdit }: { user: UserForProvider; canEdit: boolean }) {
  const [open, setOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const copyToClipboard = useCopyToClipboard();
  const { handleSendPasswordResetEmail, handleResendOnboardingEmail } = useUsers();


  return (
    <div className="text-right">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => copyToClipboard(user.id, "User ID")} className="cursor-pointer">
            <Copy className="mr-2 h-4 w-4" />
            Copy User ID
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => copyToClipboard(user.email, "Email")} className="cursor-pointer">
            <Copy className="mr-2 h-4 w-4" />
            Copy Email
          </DropdownMenuItem>

          {canEdit && (
            <>
              <DropdownMenuSeparator />
              {user.is_onboarded ? (
                <DropdownMenuItem onClick={() => handleSendPasswordResetEmail(user.email)} className="cursor-pointer">
                  <Mail className="mr-2 h-4 w-4" />
                  Send Password Reset Email
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => handleResendOnboardingEmail(user.id)} className="cursor-pointer">
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Onboarding Email
                </DropdownMenuItem>
              )}

              <DropdownMenuItem onClick={() => setOpen(true)} className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" />
                Edit User
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDeleteModal(true)} className="cursor-pointer text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete User
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <UserSheet
        sheetOpen={open}
        setSheetOpen={setOpen}
        initialData={{
          email: user.email,
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          global_role: user.roles[0] ? user.roles[0].role_type_id : "null",
          send_invite: false,
        }}
        user_id={user.id}
        onSuccess={() => setOpen(false)}
      />
      <DeleteUserModal open={showDeleteModal} onOpenChange={setShowDeleteModal} userEmail={user.email} userId={user.id} />
    </div>
  );
}
