"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SectionBuilder } from '@/components/cms/SectionBuilder';
import { FieldBuilder } from '@/components/cms/FieldBuilder';
import { SchemaPreview } from '@/components/cms/SchemaPreview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, FileText, Plus, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { createSection, updateSection, deleteSection } from '@/actions/cms/section-actions';

interface PageSchemaClientPageProps {
  initialPage: any;
}

export function PageSchemaClientPage({ initialPage }: PageSchemaClientPageProps) {
  const router = useRouter();
  const [page, setPage] = useState(initialPage);
  const [sections, setSections] = useState(initialPage.cms_sections || []);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    initialPage.cms_sections?.[0]?.id || null
  );

  // Track changes
  useEffect(() => {
    const hasChanges = JSON.stringify(initialPage.cms_sections) !== JSON.stringify(sections);
    setHasUnsavedChanges(hasChanges);
  }, [sections, initialPage.cms_sections]);

  const handleBackToPages = () => {
    if (hasUnsavedChanges) {
      const confirmed = confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }
    router.push('/dashboard/pages');
  };

  const handleAddSection = async () => {
    const newSectionName = prompt('Section name:');
    if (!newSectionName) return;

    try {
      const result = await createSection({
        page_id: page.id,
        name: newSectionName,
        description: '',
        order: sections.length
      });

      if (result.success) {
        const newSection = {
          ...result.data,
          cms_fields: []
        };
        setSections(prev => [...prev, newSection]);
        setSelectedSectionId(newSection.id);
        toast.success('Section created successfully');
      } else {
        toast.error(result.error || 'Failed to create section');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  const handleSectionUpdate = (updatedSection: any) => {
    setSections(prev => prev.map(s => s.id === updatedSection.id ? updatedSection : s));
  };

  const handleSectionDelete = async (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;

    try {
      const result = await deleteSection(sectionId);
      if (result.success) {
        setSections(prev => prev.filter(s => s.id !== sectionId));
        if (selectedSectionId === sectionId) {
          setSelectedSectionId(sections[0]?.id || null);
        }
        toast.success('Section deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete section');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  const handleExportSchema = () => {
    const pageSchema = {
      ...page,
      sections: sections,
      exported_at: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(pageSchema, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `${page.slug}-schema-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Schema exported successfully');
  };

  const selectedSection = sections.find(s => s.id === selectedSectionId);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={handleBackToPages}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pages
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{page.name}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={page.status === 'active' ? 'default' : 
                            page.status === 'draft' ? 'secondary' : 'outline'}>
                {page.status}
              </Badge>
              <span className="text-sm text-muted-foreground">/{page.slug}</span>
              <div className="flex items-center text-sm text-muted-foreground">
                <Globe className="mr-1 h-3 w-3" />
                {page.cms_websites?.name}
              </div>
              {hasUnsavedChanges && (
                <Badge variant="destructive" className="animate-pulse">
                  Unsaved Changes
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleExportSchema}
            disabled={sections.length === 0}
          >
            <FileText className="mr-2 h-4 w-4" />
            Export Schema
          </Button>
        </div>
      </div>

      {/* Schema Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Section Builder */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Page Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Sections</span>
                  <Button size="sm" onClick={handleAddSection}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {sections.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No sections yet. Create your first section to get started.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sections.map((section: any) => (
                      <div
                        key={section.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedSectionId === section.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:bg-muted'
                        }`}
                        onClick={() => setSelectedSectionId(section.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{section.name}</h4>
                            {section.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {section.description}
                              </p>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {section.cms_fields?.length || 0} field{(section.cms_fields?.length || 0) !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Field Builder */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Fields</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedSection ? (
                <FieldBuilder 
                  sectionId={selectedSectionId!} 
                  section={selectedSection}
                  onSectionUpdate={handleSectionUpdate}
                />
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Select a section to manage its fields
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Schema Preview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Schema Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <SchemaPreview sections={sections} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Page Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Page Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Name:</strong> {page.name}
            </div>
            <div>
              <strong>Status:</strong> {page.status}
            </div>
            <div>
              <strong>Slug:</strong> /{page.slug}
            </div>
            <div>
              <strong>Website:</strong> {page.cms_websites?.name} ({page.cms_websites?.domain})
            </div>
            {page.description && (
              <div className="md:col-span-3">
                <strong>Description:</strong> {page.description}
              </div>
            )}
            <div>
              <strong>Created:</strong> {page.created_at ? new Date(page.created_at).toLocaleDateString() : 'Unknown'}
            </div>
            <div>
              <strong>Updated:</strong> {page.updated_at ? new Date(page.updated_at).toLocaleDateString() : 'Never'}
            </div>
            <div>
              <strong>Sections:</strong> {sections.length}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
} 