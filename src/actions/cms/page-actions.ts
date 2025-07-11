"use server";

import { createClient } from "@/lib/supabase/supabaseServerClient";
import { checkRequiredRoles } from "@/server/auth/check-required-roles";
import { ActionResponse } from "@/types/actions";
import { revalidatePath } from "next/cache";
import { Page, PageStatus, SupabasePage } from "@/types/cms";

interface CreatePageData {
  website_id: string;
  name: string;
  description?: string;
  slug: string;
  status?: PageStatus;
}

interface UpdatePageData {
  name?: string;
  description?: string;
  slug?: string;
  status?: PageStatus;
}

export async function createPage(data: CreatePageData): Promise<ActionResponse<Page>> {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can create pages." };
  }

  try {
    const { data: page, error } = await supabase
      .from("cms_pages")
      .insert({
        website_id: data.website_id,
        name: data.name,
        description: data.description,
        slug: data.slug,
        status: data.status || 'draft'
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating page:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/pages");
    return { success: true, data: page as Page };
  } catch (error) {
    console.error("Unexpected error creating page:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function updatePage(id: string, data: UpdatePageData): Promise<ActionResponse<Page>> {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can update pages." };
  }

  try {
    const { data: page, error } = await supabase
      .from("cms_pages")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating page:", error);
      return { success: false, error: error.message };
    }

    // Get the page with its sections
    const pageWithSections = await getPageWithSections(id);
    if (!pageWithSections.success) {
      return pageWithSections;
    }

    revalidatePath("/dashboard/pages");
    return { success: true, data: pageWithSections.data! };
  } catch (error) {
    console.error("Unexpected error updating page:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function deletePage(id: string): Promise<ActionResponse<void>> {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can delete pages." };
  }

  try {
    const { error } = await supabase
      .from("cms_pages")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting page:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/pages");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting page:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function getPagesByWebsite(websiteId: string): Promise<ActionResponse<Page[]>> {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  try {
    const { data: pages, error } = await supabase
      .from("cms_pages")
      .select("*")
      .eq("website_id", websiteId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pages:", error);
      return { success: false, error: error.message };
    }

    // Convert to Page types with empty sections arrays for now
    const pagesWithSections: Page[] = pages.map(page => ({
      ...page,
      sections: []
    }));

    return { success: true, data: pagesWithSections };
  } catch (error) {
    console.error("Unexpected error fetching pages:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function getAllPages(): Promise<ActionResponse<Page[]>> {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Only admins can view all pages." };
  }

  try {
    const { data: pages, error } = await supabase
      .from("cms_pages")
      .select(`
        *,
        cms_websites (
          name,
          domain
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching all pages:", error);
      return { success: false, error: error.message };
    }

    // Convert to Page types with empty sections arrays for now
    const pagesWithSections: Page[] = pages.map(page => ({
      ...page,
      sections: []
    }));

    return { success: true, data: pagesWithSections };
  } catch (error) {
    console.error("Unexpected error fetching all pages:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function getPageWithSections(pageId: string): Promise<ActionResponse<Page>> {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized: User not authenticated." };
  }

  try {
    // Get page details
    const { data: page, error: pageError } = await supabase
      .from("cms_pages")
      .select("*")
      .eq("id", pageId)
      .single();

    if (pageError) {
      console.error("Error fetching page:", pageError);
      return { success: false, error: pageError.message };
    }

    // Get sections with fields
    const { data: sections, error: sectionsError } = await supabase
      .from("cms_sections")
      .select(`
        *,
        cms_fields (*)
      `)
      .eq("page_id", pageId)
      .order("created_at", { ascending: true });

    if (sectionsError) {
      console.error("Error fetching sections:", sectionsError);
      return { success: false, error: sectionsError.message };
    }

    // Transform the data to match our types
    const pageWithSections: Page = {
      ...page,
      sections: sections.map(section => ({
        id: section.id,
        name: section.name,
        description: section.description,
        fields: section.cms_fields
          .sort((a: any, b: any) => a.order - b.order)
          .map((field: any) => ({
            id: field.id,
            name: field.name,
            type: field.type,
            required: field.required,
            defaultValue: field.default_value,
            validation: field.validation,
            order: field.order
          }))
      }))
    };

    return { success: true, data: pageWithSections };
  } catch (error) {
    console.error("Unexpected error fetching page with sections:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
} 