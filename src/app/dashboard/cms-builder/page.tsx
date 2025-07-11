"use client";

import { useState } from 'react';
import { SectionBuilder } from '@/components/cms/SectionBuilder';
import { SchemaPreview } from '@/components/cms/SchemaPreview';
import { useCMSStore } from '@/stores/useCMSStore';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Database, 
  FileJson, 
  Layers, 
  Save, 
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

export default function CMSBuilderPage() {
  const { sections, loadSchema, exportSchema } = useCMSStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveToSupabase = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement actual Supabase save once migration is run
      // await cmsAPI.saveSchema(sections);
      
      // For now, simulate save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Schema saved to database");
    } catch (error) {
      toast.error("Failed to save schema to database");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadFromSupabase = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement actual Supabase load once migration is run
      // const loadedSections = await cmsAPI.getSections();
      // loadSchema(loadedSections);
      
      // For now, simulate load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Schema loaded from database");
    } catch (error) {
      toast.error("Failed to load schema from database");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportSchema = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const result = e.target?.result as string;
            const importedData = JSON.parse(result);
            
            if (importedData.sections && Array.isArray(importedData.sections)) {
              loadSchema(importedData.sections);
              toast.success("Schema imported successfully");
            } else {
              throw new Error('Invalid schema format');
            }
          } catch (error) {
            toast.error("Invalid schema file format");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const getSchemaStats = () => {
    const totalFields = sections.reduce((acc, section) => acc + section.fields.length, 0);
    const requiredFields = sections.reduce((acc, section) => 
      acc + section.fields.filter(f => f.required).length, 0
    );
    
    return {
      sections: sections.length,
      totalFields,
      requiredFields,
    };
  };

  const stats = getSchemaStats();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center">
                <Database className="mr-3 h-8 w-8" />
                CMS Schema Builder
              </h1>
              <p className="text-muted-foreground mt-1">
                Design and manage your content model with a visual interface
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handleImportSchema}
                disabled={isLoading}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import Schema
              </Button>
              <Button
                variant="outline"
                onClick={handleLoadFromSupabase}
                disabled={isLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Load from DB
              </Button>
              <Button
                onClick={handleSaveToSupabase}
                disabled={isLoading}
              >
                <Save className="mr-2 h-4 w-4" />
                Save to DB
              </Button>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {stats.sections} section{stats.sections !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{stats.totalFields} fields</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{stats.requiredFields} required</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="builder" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-400">
            <TabsTrigger value="builder" className="flex items-center">
              <Layers className="mr-2 h-4 w-4" />
              Builder
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center">
              <FileJson className="mr-2 h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Model Builder</CardTitle>
                <p className="text-muted-foreground">
                  Create sections and define their fields to build your content model.
                </p>
              </CardHeader>
              <CardContent>
                <SectionBuilder />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <SchemaPreview />
          </TabsContent>
        </Tabs>
      </div>

      {/* Help Section */}
      {/* <div className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Getting Started</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Start by creating your first section. Each section represents a content type (like Blog Post, Product, etc.).
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Field Types</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Choose from various field types including text, rich text, numbers, dates, images, and references to other sections.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Export & Import</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Export your schema as JSON for backup or sharing. Import existing schemas to quickly set up your content model.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div> */}
    </div>
  );
} 