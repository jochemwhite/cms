"use server";

import { createClient } from "@/lib/supabase/supabaseServerClient";
import { getActiveTenantAndWebsiteIds } from "@/server/utils";
import { ActionResponse } from "@/types/actions";
import { Database } from "@/types/supabase";

export type FormNotificationPreference =
  Database["public"]["Tables"]["form_notification_preferences"]["Row"];

export interface FormWithNotificationPref {
  id: string;
  name: string;
  description: string | null;
  published: boolean;
  notify_email: boolean;
  notify_email_address: string | null;
}

export async function getNotificationPreferences(): Promise<
  ActionResponse<{ forms: FormWithNotificationPref[]; userEmail: string }>
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized." };
  }

  const { tenantId, websiteId } = await getActiveTenantAndWebsiteIds();
  if (!tenantId) return { success: false, error: "No active tenant selected." };
  if (!websiteId) return { success: false, error: "No active website selected." };

  const { data: forms, error: formsError } = await supabase
    .from("cms_forms")
    .select("id, name, description, published")
    .eq("tenant_id", tenantId)
    .eq("website_id", websiteId)
    .is("archived_at", null)
    .order("name", { ascending: true });

  if (formsError) {
    return { success: false, error: formsError.message };
  }

  const { data: prefs } = await supabase
    .from("form_notification_preferences")
    .select("form_id, notify_email, notify_email_address")
    .eq("user_id", user.id)
    .eq("tenant_id", tenantId);

  const prefMap = new Map(
    (prefs ?? []).map((p) => [p.form_id, p]),
  );

  const result: FormWithNotificationPref[] = (forms ?? []).map((form) => {
    const pref = prefMap.get(form.id);
    return {
      id: form.id,
      name: form.name,
      description: form.description,
      published: form.published,
      notify_email: pref?.notify_email ?? false,
      notify_email_address: pref?.notify_email_address ?? null,
    };
  });

  return { success: true, data: { forms: result, userEmail: user.email ?? "" } };
}

export async function toggleFormNotification(
  formId: string,
  enabled: boolean,
  emailAddress?: string,
): Promise<ActionResponse<void>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized." };
  }

  const { tenantId, websiteId } = await getActiveTenantAndWebsiteIds();
  if (!tenantId) return { success: false, error: "No active tenant selected." };
  if (!websiteId) return { success: false, error: "No active website selected." };

  const { data: form, error: formError } = await supabase
    .from("cms_forms")
    .select("id")
    .eq("id", formId)
    .eq("tenant_id", tenantId)
    .eq("website_id", websiteId)
    .is("archived_at", null)
    .single();

  if (formError || !form) {
    return { success: false, error: "Form not found." };
  }

  if (enabled) {
    const normalizedEmail = emailAddress?.trim() || null;

    const { error } = await supabase
      .from("form_notification_preferences")
      .upsert(
        {
          user_id: user.id,
          tenant_id: tenantId,
          form_id: formId,
          notify_email: true,
          notify_email_address: normalizedEmail,
        },
        { onConflict: "user_id,form_id" },
      );

    if (error) {
      return { success: false, error: error.message };
    }
  } else {
    const { error } = await supabase
      .from("form_notification_preferences")
      .delete()
      .eq("user_id", user.id)
      .eq("form_id", formId);

    if (error) {
      return { success: false, error: error.message };
    }
  }

  return { success: true };
}

export async function updateNotificationEmail(
  formId: string,
  emailAddress: string,
): Promise<ActionResponse<void>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized." };
  }

  const normalizedEmail = emailAddress.trim() || null;

  const { error } = await supabase
    .from("form_notification_preferences")
    .update({ notify_email_address: normalizedEmail })
    .eq("user_id", user.id)
    .eq("form_id", formId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
