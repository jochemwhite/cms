import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { DeleteUser } from "@/actions/authentication/user-management";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
  userId: string;
}

export default function DeleteUserModal({ open, onOpenChange, userEmail, userId }: Props) {
  const handleDelete = async () => {
    await DeleteUser(userId);
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Confirm Delete"
      description={`Are you sure you want to delete the user '${userEmail}'? This action cannot be undone.`}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      }
      contentClassName="max-w-sm"
    >
      <div className="py-2">This will permanently remove the user from the system.</div>
    </Modal>
  );
}
