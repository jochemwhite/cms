"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { createWebsite, updateWebsite } from "@/actions/cms/website-actions";
import { Website } from "@/types/cms";

interface WebsiteFormData {
  tenant_id: string;
  name: string;
  domain: string;
  description: string;
  status: 'active' | 'inactive' | 'maintenance';
}

interface WebsiteFormProps {
  isOpen: boolean;
  onClose: () => void;
  website?: any;
  availableTenants: { id: string; name: string }[];
  onSuccess: (website: Website) => void;
}

export function WebsiteForm({ isOpen, onClose, website, availableTenants, onSuccess }: WebsiteFormProps) {
  const [formData, setFormData] = useState<WebsiteFormData>({
    tenant_id: '',
    name: '',
    domain: '',
    description: '',
    status: 'active',
  });
  const [errors, setErrors] = useState<Partial<WebsiteFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!website;

  // Initialize form data when editing
  useEffect(() => {
    if (isEditing && website) {
      setFormData({
        tenant_id: website.tenant_id || '',
        name: website.name || '',
        domain: website.domain || '',
        description: website.description || '',
        status: website.status || 'active',
      });
    } else {
      // Reset form for create
      setFormData({
        tenant_id: '',
        name: '',
        domain: '',
        description: '',
        status: 'active',
      });
    }
    setErrors({});
  }, [isEditing, website, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<WebsiteFormData> = {};

    if (!formData.tenant_id.trim()) {
      newErrors.tenant_id = 'Tenant is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.domain.trim()) {
      newErrors.domain = 'Domain is required';
    } else {
      // Basic domain validation
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
      if (!domainRegex.test(formData.domain)) {
        newErrors.domain = 'Please enter a valid domain';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing) {
        const result = await updateWebsite(website.id, {
          name: formData.name,
          domain: formData.domain,
          description: formData.description || undefined,
          status: formData.status,
        });

        if (result.success) {
          onSuccess(result.data!);
        } else {
          toast.error(result.error || 'Failed to update website');
        }
      } else {
        const result = await createWebsite({
          tenant_id: formData.tenant_id,
          name: formData.name,
          domain: formData.domain,
          description: formData.description || undefined,
          status: formData.status,
        });

        if (result.success) {
          onSuccess(result.data!);
        } else {
          toast.error(result.error || 'Failed to create website');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof WebsiteFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Website' : 'Create Website'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tenant Selection (only for create) */}
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="tenant_id">Tenant</Label>
              <Select
                value={formData.tenant_id}
                onValueChange={(value) => handleInputChange('tenant_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a tenant" />
                </SelectTrigger>
                <SelectContent>
                  {availableTenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tenant_id && (
                <p className="text-sm text-red-600">{errors.tenant_id}</p>
              )}
            </div>
          )}

          {/* Website Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="My Website"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Domain */}
          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              value={formData.domain}
              onChange={(e) => handleInputChange('domain', e.target.value)}
              placeholder="example.com"
            />
            {errors.domain && (
              <p className="text-sm text-red-600">{errors.domain}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="A brief description of this website..."
              rows={3}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'active' | 'inactive' | 'maintenance') => 
                handleInputChange('status', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Website' : 'Create Website'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 