"use client";

import { useState } from 'react';
import { useCMSStore } from '@/stores/useCMSStore';
import { Field, FieldType } from '@/types/cms';
import { 
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';

interface FieldFormData {
  name: string;
  type: FieldType;
  required: boolean;
  defaultValue: string;
  validation: string;
}

interface FieldBuilderProps {
  sectionId: string;
}

interface SortableFieldProps {
  field: Field;
  sectionId: string;
  onEdit: (field: Field) => void;
  onDelete: (fieldId: string) => void;
}

function SortableField({ field, sectionId, onEdit, onDelete }: SortableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getFieldTypeIcon = (type: FieldType) => {
    switch (type) {
      case 'text': return '📝';
      case 'number': return '🔢';
      case 'boolean': return '☑️';
      case 'date': return '📅';
      case 'richtext': return '📄';
      case 'image': return '🖼️';
      case 'reference': return '🔗';
      default: return '📝';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm group hover:shadow-md transition-shadow"
    >
      <div className="flex items-center space-x-3">
        <button
          className="cursor-grab opacity-50 hover:opacity-100"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getFieldTypeIcon(field.type)}</span>
          <div>
            <div className="font-medium">{field.name}</div>
            <div className="text-sm text-muted-foreground">
              {field.type}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(field)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Field</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the field "{field.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(field.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export function FieldBuilder({ sectionId }: FieldBuilderProps) {
  const { sections, addField, updateField, removeField, reorderFields } = useCMSStore();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [formData, setFormData] = useState<FieldFormData>({
    name: '',
    type: 'text',
    required: false,
    defaultValue: '',
    validation: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const section = sections.find(s => s.id === sectionId);
  const fields = section?.fields || [];

  const fieldTypes: { value: FieldType; label: string; description: string }[] = [
    { value: 'text', label: 'Text', description: 'Single line text input' },
    { value: 'richtext', label: 'Rich Text', description: 'Multi-line text editor' },
    { value: 'number', label: 'Number', description: 'Numeric input' },
    { value: 'boolean', label: 'Boolean', description: 'True/false checkbox' },
    { value: 'date', label: 'Date', description: 'Date picker' },
    { value: 'image', label: 'Image', description: 'File upload for images' },
    { value: 'reference', label: 'Reference', description: 'Link to another section' },
  ];

  const handleAddField = () => {
    if (formData.name.trim()) {
      addField(sectionId, {
        name: formData.name.trim(),
        type: formData.type,
        required: formData.required,
        defaultValue: formData.defaultValue.trim() || undefined,
        validation: formData.validation.trim() || undefined,
      });
      resetForm();
      setIsAddDialogOpen(false);
    }
  };

  const handleEditField = (field: Field) => {
    setFormData({
      name: field.name,
      type: field.type,
      required: field.required || false,
      defaultValue: field.defaultValue || '',
      validation: field.validation || '',
    });
    setEditingField(field);
  };

  const handleUpdateField = () => {
    if (editingField && formData.name.trim()) {
      updateField(sectionId, editingField.id, {
        name: formData.name.trim(),
        type: formData.type,
        required: formData.required,
        defaultValue: formData.defaultValue.trim() || undefined,
        validation: formData.validation.trim() || undefined,
      });
      resetForm();
      setEditingField(null);
    }
  };

  const handleDeleteField = (fieldId: string) => {
    removeField(sectionId, fieldId);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = fields.findIndex(field => field.id === active.id);
      const newIndex = fields.findIndex(field => field.id === over.id);
      
      const newFields = arrayMove(fields, oldIndex, newIndex).map((field, index) => ({
        ...field,
        order: index,
      }));
      
      reorderFields(sectionId, newFields);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'text',
      required: false,
      defaultValue: '',
      validation: '',
    });
    setEditingField(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Fields</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Field
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Field</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="field-name">Field Name</Label>
                <Input
                  id="field-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., title, description, price"
                />
              </div>
              
              <div>
                <Label htmlFor="field-type">Field Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: FieldType) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="field-required"
                  checked={formData.required}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, required: !!checked }))}
                />
                <Label htmlFor="field-required">Required field</Label>
              </div>

              <div>
                <Label htmlFor="field-default">Default Value (Optional)</Label>
                <Input
                  id="field-default"
                  value={formData.defaultValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultValue: e.target.value }))}
                  placeholder="Default value for this field"
                />
              </div>

              <div>
                <Label htmlFor="field-validation">Validation (Optional)</Label>
                <Textarea
                  id="field-validation"
                  value={formData.validation}
                  onChange={(e) => setFormData(prev => ({ ...prev, validation: e.target.value }))}
                  placeholder="e.g., min: 1, max: 100"
                  rows={2}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddField}>
                  Add Field
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editingField} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Field</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-field-name">Field Name</Label>
                <Input
                  id="edit-field-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., title, description, price"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-field-type">Field Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: FieldType) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-field-required"
                  checked={formData.required}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, required: !!checked }))}
                />
                <Label htmlFor="edit-field-required">Required field</Label>
              </div>

              <div>
                <Label htmlFor="edit-field-default">Default Value (Optional)</Label>
                <Input
                  id="edit-field-default"
                  value={formData.defaultValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultValue: e.target.value }))}
                  placeholder="Default value for this field"
                />
              </div>

              <div>
                <Label htmlFor="edit-field-validation">Validation (Optional)</Label>
                <Textarea
                  id="edit-field-validation"
                  value={formData.validation}
                  onChange={(e) => setFormData(prev => ({ ...prev, validation: e.target.value }))}
                  placeholder="e.g., min: 1, max: 100"
                  rows={2}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateField}>
                  Update Field
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {fields.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="text-center">
              <h4 className="font-medium text-muted-foreground">No fields yet</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Add fields to define the structure of this section
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add First Field
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {fields.map((field) => (
                <SortableField
                  key={field.id}
                  field={field}
                  sectionId={sectionId}
                  onEdit={handleEditField}
                  onDelete={handleDeleteField}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
} 