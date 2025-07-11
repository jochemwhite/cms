import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { DeleteUser } from "@/actions/authentication/user-management";
import { PageForm } from "../forms/PageForm";
import { Page } from "@/types/cms";
import { Database } from "@/types/supabase";

interface Props {
  isFormOpen: boolean;
  handleFormClose: () => void;
  page?: Database["public"]["Tables"]["cms_pages"]["Row"];
}

export default function PageFormModal({  isFormOpen, handleFormClose, page }: Props) {


  return (
    <Modal
      open={isFormOpen}
      onOpenChange={handleFormClose}
      title="Page Form"
      description="This is the page form"
      contentClassName="max-w-sm"
    >
      <PageForm isOpen={isFormOpen} onClose={handleFormClose} page={page} />
    </Modal>
  );
}
