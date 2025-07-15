"use client";

import { createPage } from "@/actions/cms/page-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database } from "@/types/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

// Form validation schema
const formSchema = z.object({
  name: z
    .string()
    .min(1, "Page name is required")
    .min(2, "Page name must be at least 2 characters")
    .max(100, "Page name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
    .refine((slug) => !slug.startsWith("-") && !slug.endsWith("-"), "Slug cannot start or end with a hyphen"),
  status: z.enum(["draft", "active", "archived"] as const),
});

type FormData = z.infer<typeof formSchema>;

interface PageFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: Database["public"]["Tables"]["cms_pages"]["Row"]) => void;
  page?: Database["public"]["Tables"]["cms_pages"]["Row"]; // undefined for create, string for edit
  websiteId: string;
}

export function PageForm({ isOpen, onClose, onSuccess, page, websiteId }: PageFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!page;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      slug: "",
      status: "draft",
    },
  });

  const watchedName = form.watch("name");
  const watchedSlug = form.watch("slug");

  // Initialize form data when editing
  useEffect(() => {
    if (isEditing) {
      form.reset({
        name: page.name,
        description: page.description || "",
        slug: page.slug,
        status: page.status || "draft",
      });
    } else {
      // Reset form for create
      form.reset({
        name: "",
        description: "",
        slug: "",
        status: "draft",
      });
    }
  }, [isEditing, page, isOpen, form]);

  // Auto-generate slug from name when slug field is empty (with debounce)
  useEffect(() => {
    if (watchedName && (!watchedSlug || watchedSlug.trim() === "")) {
      const timeoutId = setTimeout(() => {
        const generatedSlug = generateSlug(watchedName);
        form.setValue("slug", generatedSlug);
      }, 300); // 300ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [watchedName, watchedSlug, form]);

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const isSlugAvailable = (slug: string, excludePageId?: string): boolean => {
    // TODO: Check if the slug is available for the website using the supabase client in server action
    return true;
  };

  const handleSubmit = async (data: FormData) => {
    // Additional validation for slug availability
    if (!isSlugAvailable(data.slug, page?.id)) {
      form.setError("slug", { message: "This slug is already in use" });
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing) {
        // TODO: create a server action to update the page in the database
        const result = { success: true };

        if (result.success) {
          toast.success("Page updated successfully");
          // TODO: create a server action to update the page in the database
        } else {
          // toast.error(result.error || "Failed to update page");
          return;
        }
      } else {
        console.log("Creating page", data);
        const result = await createPage({
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          slug: data.slug.trim(),
          status: data.status,
        }, websiteId);

        if (result.success) {
          toast.success("Page created successfully");
          onSuccess(result.data as Database["public"]["Tables"]["cms_pages"]["Row"]);
          // TODO: create a server action to create the page in the database
        } else {
          toast.error(result.error || "Failed to create page");
          return;
        }
      }

      onClose();
    } catch (error) {
      toast.error(isEditing ? "Failed to update page" : "Failed to create page");
    } finally {
      setIsSubmitting(false);
    }
  };



  const handleSlugGenerate = () => {
    if (watchedName) {
      // Clear the slug field first, then let the auto-generation handle it
      form.setValue("slug", "");
    }
  };

  const isSlugValid = watchedSlug && !form.formState.errors.slug && isSlugAvailable(watchedSlug, page?.id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Page" : "Create New Page"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit, (errors) => {
            console.log("Errors", errors);
          })} className="space-y-6">
            {/* Website Selection (for create only) */}

            <div className="flex flex-col gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., About Us, Contact, Home" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
                              Draft
                            </div>
                          </SelectItem>
                          <SelectItem value="active">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                              Active
                            </div>
                          </SelectItem>
                          <SelectItem value="archived">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-gray-500 rounded-full mr-2" />
                              Archived
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug *</FormLabel>
                    <div className="flex space-x-2">
                      <FormControl>
                        <Input
                          placeholder="page-slug"
                          {...field}
                        />
                      </FormControl>
                      <Button type="button" variant="outline" size="sm" onClick={handleSlugGenerate} disabled={!watchedName}>
                        Generate
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <Label className="text-sm">URL Preview</Label>
                <div className="p-2 bg-muted rounded text-sm font-mono">
                  <span className={isSlugValid ? "text-green-600" : "text-muted-foreground"}>
                    {`https://${websiteId}/${watchedSlug || "page-slug"}`}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {isSlugValid ? (
                  <div className="flex items-center text-green-600 text-sm">
                    <Check className="h-4 w-4 mr-1" />
                    Slug is available
                  </div>
                ) : watchedSlug && !form.formState.errors.slug ? (
                  <div className="flex items-center text-yellow-600 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Checking availability...
                  </div>
                ) : null}
              </div>
              {isEditing && page && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Current Schema</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Sections:</span>
                        <Badge variant="secondary">{page.sections?.length || 0}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Fields:</span>
                        <Badge variant="secondary">
                          {page.sections?.reduce((acc: number, section: any) => acc + (section.fields?.length || 0), 0) || 0}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Last Updated:</span>
                        <span className="text-sm">{page.updated_at ? new Date(page.updated_at).toLocaleDateString() : "Never"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isEditing ? "Update Page" : "Create Page"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
