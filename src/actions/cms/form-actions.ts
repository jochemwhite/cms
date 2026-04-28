"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import {
  CreateCmsFormSchema,
  CreateCmsFormSchemaType,
  UpdateCmsFormContentSchema,
  UpdateCmsFormContentSchemaType,
} from "@/schemas/form-builder";
import { checkRequiredRoles } from "@/server/auth/check-required-roles";
import { getActiveTenantAndWebsiteIds } from "@/server/utils";
import { ActionResponse } from "@/types/actions";
import { Database } from "@/types/supabase";

export type CmsForm = Database["public"]["Tables"]["cms_forms"]["Row"];
export type CmsFormSubmission = Database["public"]["Tables"]["cms_form_submissions"]["Row"];

export interface CmsFormStats {
  visits: number;
  submissions: number;
  submissionRate: number;
  bounceRate: number;
}

async function getAuthorizedContext() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized: User not authenticated." } as const;
  }

  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { error: "Unauthorized: Only admins can manage forms." } as const;
  }

  const { tenantId, websiteId } = await getActiveTenantAndWebsiteIds();
  if (!tenantId) {
    return { error: "No active tenant selected." } as const;
  }

  if (!websiteId) {
    return { error: "No active website selected." } as const;
  }

  return { supabase, user, tenantId, websiteId } as const;
}

export async function getFormsForActiveWebsite(): Promise<ActionResponse<CmsForm[]>> {
  const supabase = await createClient();
  const { tenantId, websiteId } = await getActiveTenantAndWebsiteIds();

  if (!tenantId) {
    return { success: false, error: "No active tenant selected." };
  }

  if (!websiteId) {
    return { success: false, error: "No active website selected." };
  }
 

  const { data, error } = await supabase
    .from("cms_forms")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("website_id", websiteId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching forms:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data: data ?? [] };
}

export async function createFormForActiveWebsite(
  payload: CreateCmsFormSchemaType,
): Promise<ActionResponse<CmsForm>> {
  const parsed = CreateCmsFormSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid form payload." };
  }

  const context = await getAuthorizedContext();
  if ("error" in context) {
    return { success: false, error: context.error };
  }

  const { supabase, user, tenantId, websiteId } = context;
  const { name, description } = parsed.data;

  const { data, error } = await supabase
    .from("cms_forms")
    .insert({
      tenant_id: tenantId,
      website_id: websiteId,
      created_by: user.id,
      name,
      description: description || null,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error creating form:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/forms");
  return { success: true, data };
}

export async function updateFormDetails(
  formId: string,
  payload: CreateCmsFormSchemaType,
): Promise<ActionResponse<CmsForm>> {
  const parsed = CreateCmsFormSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid form payload." };
  }

  const context = await getAuthorizedContext();
  if ("error" in context) {
    return { success: false, error: context.error };
  }

  const { supabase, tenantId, websiteId } = context;
  const { name, description } = parsed.data;

  const { data, error } = await supabase
    .from("cms_forms")
    .update({
      name,
      description: description || null,
    })
    .eq("id", formId)
    .eq("tenant_id", tenantId)
    .eq("website_id", websiteId)
    .is("archived_at", null)
    .select("*")
    .single();

  if (error) {
    console.error("Error updating form details:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/forms");
  revalidatePath(`/dashboard/forms/${formId}`);
  return { success: true, data };
}

export async function getFormById(formId: string): Promise<ActionResponse<CmsForm>> {
  const supabase = await createClient();
  const { tenantId, websiteId } = await getActiveTenantAndWebsiteIds();

  if (!tenantId) {
    return { success: false, error: "No active tenant selected." };
  }

  if (!websiteId) {
    return { success: false, error: "No active website selected." };
  }

  const { data, error } = await supabase
    .from("cms_forms")
    .select("*")
    .eq("id", formId)
    .eq("tenant_id", tenantId)
    .eq("website_id", websiteId)
    .is("archived_at", null)
    .single();

  if (error) {
    console.error("Error fetching form:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function updateFormContent(
  formId: string,
  payload: UpdateCmsFormContentSchemaType,
): Promise<ActionResponse<CmsForm>> {
  const parsed = UpdateCmsFormContentSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid form content payload." };
  }

  const supabase = await createClient();
  const { tenantId, websiteId } = await getActiveTenantAndWebsiteIds();

  if (!tenantId) {
    return { success: false, error: "No active tenant selected." };
  }

  if (!websiteId) {
    return { success: false, error: "No active website selected." };
  }


  const updatePayload: Record<string, unknown> = {
    content: parsed.data.content as Database["public"]["Tables"]["cms_forms"]["Row"]["content"],
  };

  if (parsed.data.settings) {
    updatePayload.settings = parsed.data.settings;
  }

  const { data, error } = await supabase
    .from("cms_forms")
    .update({
      ...(updatePayload as any),
    })
    .eq("id", formId)
    .eq("tenant_id", tenantId)
    .eq("website_id", websiteId)
    .is("archived_at", null)
    .select("*")
    .single();

  if (error) {
    console.error("Error updating form content:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/forms");
  revalidatePath(`/dashboard/forms/${formId}`);
  return { success: true, data };
}

export async function setFormPublishedState(formId: string, published: boolean): Promise<ActionResponse<CmsForm>> {
  const context = await getAuthorizedContext();
  if ("error" in context) {
    return { success: false, error: context.error };
  }

  const { supabase, tenantId, websiteId } = context;

  const { data, error } = await supabase
    .from("cms_forms")
    .update({ published })
    .eq("id", formId)
    .eq("tenant_id", tenantId)
    .eq("website_id", websiteId)
    .is("archived_at", null)
    .select("*")
    .single();

  if (error) {
    console.error("Error updating publish state:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/forms");
  revalidatePath(`/dashboard/forms/${formId}`);
  return { success: true, data };
}

export async function archiveForm(formId: string): Promise<ActionResponse<void>> {
  const context = await getAuthorizedContext();
  if ("error" in context) {
    return { success: false, error: context.error };
  }

  const { supabase, tenantId, websiteId } = context;

  const { error } = await supabase
    .from("cms_forms")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", formId)
    .eq("tenant_id", tenantId)
    .eq("website_id", websiteId)
    .is("archived_at", null);

  if (error) {
    console.error("Error archiving form:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/forms");
  return { success: true };
}

export async function getFormSubmissions(formId: string): Promise<ActionResponse<CmsFormSubmission[]>> {
  const supabase = await createClient();
  const { tenantId, websiteId } = await getActiveTenantAndWebsiteIds();

  if (!tenantId) {
    return { success: false, error: "No active tenant selected." };
  }

  if (!websiteId) {
    return { success: false, error: "No active website selected." };
  }

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

  const { data, error } = await supabase
    .from("cms_form_submissions")
    .select("*")
    .eq("form_id", formId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching form submissions:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data: data ?? [] };
}

export async function getFormSubmissionById(
  formId: string,
  submissionId: string,
): Promise<ActionResponse<CmsFormSubmission>> {
  const supabase = await createClient();
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

  const { data, error } = await supabase
    .from("cms_form_submissions")
    .select("*")
    .eq("id", submissionId)
    .eq("form_id", formId)
    .single();

  if (error) {
    console.error("Error fetching submission:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function getFormStatsForActiveWebsite(): Promise<ActionResponse<CmsFormStats>> {
  const supabase = await createClient();
  const { tenantId, websiteId } = await getActiveTenantAndWebsiteIds();

  if (!tenantId) {
    return { success: false, error: "No active tenant selected." };
  }

  if (!websiteId) {
    return { success: false, error: "No active website selected." };
  }

  const { data, error } = await supabase
    .from("cms_forms")
    .select("visits, submissions")
    .eq("tenant_id", tenantId)
    .eq("website_id", websiteId)
    .is("archived_at", null);

  if (error) {
    console.error("Error fetching form stats:", error);
    return { success: false, error: error.message };
  }

  const visits = (data ?? []).reduce((sum, item) => sum + (item.visits ?? 0), 0);
  const submissions = (data ?? []).reduce((sum, item) => sum + (item.submissions ?? 0), 0);
  const submissionRate = visits > 0 ? (submissions / visits) * 100 : 0;

  return {
    success: true,
    data: {
      visits,
      submissions,
      submissionRate,
      bounceRate: 100 - submissionRate,
    },
  };
}
