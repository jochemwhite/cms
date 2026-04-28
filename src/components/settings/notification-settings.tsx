"use client";

import { useRef, useState, useTransition } from "react";
import {
  FormWithNotificationPref,
  toggleFormNotification,
  updateNotificationEmail,
} from "@/actions/cms/form-notification-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Bell, BellOff, Inbox, Mail } from "lucide-react";
import { toast } from "sonner";

interface NotificationSettingsProps {
  initialForms: FormWithNotificationPref[];
  userEmail: string;
}

export function NotificationSettings({ initialForms, userEmail }: NotificationSettingsProps) {
  const [forms, setForms] = useState(initialForms);
  const [isPending, startTransition] = useTransition();
  const [loadingFormId, setLoadingFormId] = useState<string | null>(null);
  const emailDebounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const enabledCount = forms.filter((f) => f.notify_email).length;

  const handleToggle = (formId: string, enabled: boolean) => {
    const form = forms.find((f) => f.id === formId);
    const email = form?.notify_email_address || userEmail;

    setLoadingFormId(formId);
    setForms((prev) =>
      prev.map((f) =>
        f.id === formId
          ? { ...f, notify_email: enabled, notify_email_address: enabled ? (f.notify_email_address || userEmail) : f.notify_email_address }
          : f,
      ),
    );

    startTransition(async () => {
      const result = await toggleFormNotification(formId, enabled, email);
      setLoadingFormId(null);

      if (!result.success) {
        setForms((prev) =>
          prev.map((f) => (f.id === formId ? { ...f, notify_email: !enabled } : f)),
        );
        toast.error(result.error || "Failed to update notification preference");
        return;
      }

      toast.success(
        enabled
          ? "Notifications enabled for this form."
          : "Notifications disabled for this form.",
      );
    });
  };

  const handleEmailChange = (formId: string, email: string) => {
    setForms((prev) =>
      prev.map((f) => (f.id === formId ? { ...f, notify_email_address: email } : f)),
    );

    const existing = emailDebounceTimers.current.get(formId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      emailDebounceTimers.current.delete(formId);
      startTransition(async () => {
        const result = await updateNotificationEmail(formId, email);
        if (!result.success) {
          toast.error("Failed to update email address");
        }
      });
    }, 800);

    emailDebounceTimers.current.set(formId, timer);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Get notified by email when someone submits a form. You can set a different email per form.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {forms.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Inbox className="h-10 w-10 text-muted-foreground" />
              <p className="font-medium">No forms yet</p>
              <p className="text-sm text-muted-foreground">
                Create a form first, then you can enable notifications here.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {enabledCount} of {forms.length} form{forms.length !== 1 ? "s" : ""} enabled
                </span>
              </div>
              <div className="rounded-md border divide-y">
                {forms.map((form) => (
                  <div key={form.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                          {form.notify_email ? (
                            <Bell className="h-4 w-4 text-primary" />
                          ) : (
                            <BellOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-medium text-sm">
                              {form.name}
                            </p>
                            <Badge
                              variant={form.published ? "default" : "secondary"}
                              className="text-xs shrink-0"
                            >
                              {form.published ? "Published" : "Draft"}
                            </Badge>
                          </div>
                          {form.description && (
                            <p className="truncate text-xs text-muted-foreground">
                              {form.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <Switch
                        checked={form.notify_email}
                        onCheckedChange={(checked) => handleToggle(form.id, checked)}
                        disabled={isPending && loadingFormId === form.id}
                      />
                    </div>
                    {form.notify_email && (
                      <div className="ml-11 flex items-center gap-2">
                        <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder={userEmail}
                          value={form.notify_email_address ?? ""}
                          onChange={(e) => handleEmailChange(form.id, e.target.value)}
                          className="h-8 text-sm max-w-sm"
                        />
                        <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
                          Leave empty to use your account email
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
