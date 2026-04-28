import { getNotificationPreferences } from "@/actions/cms/form-notification-actions";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { unauthorized } from "next/navigation";

export const metadata = {
  title: "Form Notification Settings | Amrio",
  description: "Choose which forms you want to receive email notifications for.",
};

export default async function FormSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    unauthorized();
  }

  const result = await getNotificationPreferences();
  const forms = result.success ? (result.data?.forms ?? []) : [];
  const userEmail = result.success ? (result.data?.userEmail ?? "") : "";

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 md:py-10">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Notification Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose which forms you want to receive email notifications for.
        </p>
      </div>

      <NotificationSettings initialForms={forms} userEmail={userEmail} />
    </div>
  );
}
