"use client";

import { useMemo, useState, useTransition } from "react";
import {
  archiveForm,
  CmsForm,
  CmsFormStats,
  createFormForActiveWebsite,
  setFormPublishedState,
} from "@/actions/cms/form-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUserSession } from "@/providers/session-provider";
import { Bell, Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FormsDataTable } from "./table/forms-table";
import { createFormColumns } from "./table/forms-table-columns";

interface FormsOverviewProps {
  initialForms: CmsForm[];
  initialStats: CmsFormStats;
}

export function FormsOverview({ initialForms, initialStats }: FormsOverviewProps) {
  const router = useRouter();
  const [forms, setForms] = useState<CmsForm[]>(initialForms);
  const [stats, setStats] = useState<CmsFormStats>(initialStats);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();
  const { userSession } = useUserSession();

  const isSystemAdmin = useMemo(
    () => userSession?.global_roles?.some((role) => role === "system_admin") ?? false,
    [userSession?.global_roles],
  );

  const publishedCount = useMemo(() => forms.filter((f) => f.published).length, [forms]);

  const resetForm = () => {
    setName("");
    setDescription("");
  };

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createFormForActiveWebsite({ name, description });
      if (!result.success || !result.data) {
        toast.error(result.error || "Failed to create form");
        return;
      }
      setForms((prev) => [result.data!, ...prev]);
      toast.success("Form created");
      setIsCreateOpen(false);
      resetForm();
    });
  };

  const handleTogglePublish = (form: CmsForm) => {
    startTransition(async () => {
      const result = await setFormPublishedState(form.id, !form.published);
      if (!result.success || !result.data) {
        toast.error(result.error || "Failed to update status");
        return;
      }
      setForms((prev) => prev.map((item) => (item.id === form.id ? result.data! : item)));
      toast.success(result.data.published ? "Form published" : "Form moved to draft");
    });
  };

  const handleArchive = (form: CmsForm) => {
    startTransition(async () => {
      const result = await archiveForm(form.id);
      if (!result.success) {
        toast.error(result.error || "Failed to archive form");
        return;
      }
      setForms((prev) => prev.filter((item) => item.id !== form.id));
      setStats((prev) => ({
        ...prev,
        visits: Math.max(0, prev.visits - form.visits),
        submissions: Math.max(0, prev.submissions - form.submissions),
      }));
      toast.success("Form archived");
    });
  };

  const handleOpenBuilder = (formId: string) => {
    router.push(`/dashboard/forms/${formId}`);
  };

  const columns = useMemo(
    () => createFormColumns(handleTogglePublish, handleArchive, handleOpenBuilder),
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Forms</h1>
          <p className="text-muted-foreground">
            Manage your forms and view submissions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/forms/settings">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </Link>
          </Button>
          {isSystemAdmin && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Form
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Forms</CardDescription>
            <CardTitle className="text-2xl">{forms.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Published</CardDescription>
            <CardTitle className="text-2xl">{publishedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Visits</CardDescription>
            <CardTitle className="text-2xl">{stats.visits.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Submissions</CardDescription>
            <CardTitle className="text-2xl">{stats.submissions.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Forms</CardTitle>
          <CardDescription>Click on a form to view its submissions.</CardDescription>
        </CardHeader>
        <CardContent>
          <FormsDataTable columns={columns} data={forms} />
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Form</DialogTitle>
            <DialogDescription>
              Create a new form for your website.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="form-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="form-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Contact Form"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="form-description" className="text-sm font-medium">
                Description (optional)
              </label>
              <Textarea
                id="form-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short description of what this form is for"
                rows={3}
                disabled={isPending}
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  resetForm();
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isPending || name.trim().length < 2}>
                {isPending ? "Creating..." : "Create Form"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
