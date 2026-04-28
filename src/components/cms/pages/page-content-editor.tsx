"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ContentEditor } from "@/components/cms/content-editor/content_editor";
import ContentEditorHeader from "@/components/cms/content-editor/content_editor_header";
import { PageMetadataEditor } from "@/components/cms/PageMetadataEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { savePageContent } from "@/actions/cms/schema-content-actions";
import { RPCPageResponse } from "@/types/cms";
import { SaveContentFunction } from "@/stores/content-editor-store";

interface PageContentEditorProps {
  pageId: string;
  page: {
    id: string;
    name: string;
    website: {
      domain: string;
    };
  };
  existingContent: RPCPageResponse;
  originalFields: {
    id: string;
    type: string;
    content: any;
    content_field_id?: string | null;
    collection_id?: string | null;
    form_id?: string | null;
  }[];
}

export function PageContentEditor({ pageId, page, existingContent, originalFields }: PageContentEditorProps) {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const processedSections = useMemo(() => {
    return existingContent.sections || [];
  }, [existingContent.sections]);

  const saveFn: SaveContentFunction = async (updatedFieldsJSON: string) => {
    const result = await savePageContent(pageId, updatedFieldsJSON);
    if (result.success) {
      router.refresh();
    }

    return result;
  };

  const header = (
    <ContentEditorHeader
      title="Content Editor"
      description={`Edit content for "${existingContent.name}"`}
      processedSections={processedSections}
      setExpandedSections={setExpandedSections}
    />
  );

  return (
    <Tabs defaultValue="content" className="space-y-4">
      <TabsList variant="line">
        <TabsTrigger value="content">Content</TabsTrigger>
        <TabsTrigger value="metadata">Metadata</TabsTrigger>
      </TabsList>

      <TabsContent value="content">
        <ContentEditor
          pageId={pageId}
          existingContent={existingContent}
          originalFields={originalFields}
          header={header}
          saveFn={saveFn}
          expandedSections={expandedSections}
          setExpandedSections={setExpandedSections}
        />
      </TabsContent>

      <TabsContent value="metadata">
        <PageMetadataEditor pageId={page.id} page={page} />
      </TabsContent>
    </Tabs>
  );
}
