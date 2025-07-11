import { createClient } from "@/lib/supabase/supabaseServerClient";
import { checkRequiredRoles } from "@/server/auth/check-required-roles";
import { redirect, notFound } from "next/navigation";
import { PageSchemaClientPage } from "@/components/cms/PageSchemaClientPage";

interface PageSchemaBuilderProps {
  params: Promise<{
    pageId: string;
  }>;
}

export default async function PageSchemaBuilder({ params }: PageSchemaBuilderProps) {
  const { pageId } = await params;
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return redirect("/");
  }

  // Check admin role
  const isAdmin = await checkRequiredRoles(user.id, ["system_admin"]);
  if (!isAdmin) {
    return redirect("/dashboard");
  }

  // Fetch page with sections and fields
  const { data: page, error: pageError } = await supabase
    .from("cms_pages")
    .select(`
      id,
      name,
      slug,
      description,
      status,
      website_id,
      created_at,
      updated_at,
      cms_websites (
        id,
        name,
        domain
      ),
      cms_sections (
        id,
        name,
        description,
        order,
        page_id,
        cms_fields (
          id,
          name,
          type,
          required,
          order,
          section_id
        )
      )
    `)
    .eq("id", pageId)
    .single();

  if (pageError || !page) {
    return notFound();
  }

  return (
    <div className="container mx-auto py-6">
      <PageSchemaClientPage 
        initialPage={page}
      />
    </div>
  );
} 