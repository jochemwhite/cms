import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { CMSStore, Section, Field } from '@/types/cms';

export const useCMSStore = create<CMSStore>()(
  devtools(
    (set, get) => ({
      sections: [],

      // Section management
      addSection: (name: string, description?: string) => {
        const newSection: Section = {
          id: uuidv4(),
          name,
          description,
          fields: [],
        };
        
        set((state) => ({
          sections: [...state.sections, newSection],
        }), false, 'addSection');
      },

      updateSection: (id: string, data: Partial<Section>) => {
        set((state) => ({
          sections: state.sections.map((section) =>
            section.id === id ? { ...section, ...data } : section
          ),
        }), false, 'updateSection');
      },

      removeSection: (id: string) => {
        set((state) => ({
          sections: state.sections.filter((section) => section.id !== id),
        }), false, 'removeSection');
      },

      // Field management
      addField: (sectionId: string, field: Omit<Field, 'id'>) => {
        const newField: Field = {
          id: uuidv4(),
          ...field,
          order: field.order ?? get().sections.find(s => s.id === sectionId)?.fields.length ?? 0,
        };
        
        set((state) => ({
          sections: state.sections.map((section) =>
            section.id === sectionId
              ? { ...section, fields: [...section.fields, newField] }
              : section
          ),
        }), false, 'addField');
      },

      updateField: (sectionId: string, fieldId: string, data: Partial<Field>) => {
        set((state) => ({
          sections: state.sections.map((section) =>
            section.id === sectionId
              ? {
                  ...section,
                  fields: section.fields.map((field) =>
                    field.id === fieldId ? { ...field, ...data } : field
                  ),
                }
              : section
          ),
        }), false, 'updateField');
      },

      removeField: (sectionId: string, fieldId: string) => {
        set((state) => ({
          sections: state.sections.map((section) =>
            section.id === sectionId
              ? {
                  ...section,
                  fields: section.fields.filter((field) => field.id !== fieldId),
                }
              : section
          ),
        }), false, 'removeField');
      },

      reorderFields: (sectionId: string, newFields: Field[]) => {
        set((state) => ({
          sections: state.sections.map((section) =>
            section.id === sectionId
              ? { ...section, fields: newFields }
              : section
          ),
        }), false, 'reorderFields');
      },

      // Schema management
      loadSchema: (sections: Section[]) => {
        set({ sections }, false, 'loadSchema');
      },

      exportSchema: () => {
        return get().sections;
      },
    }),
    {
      name: 'cms-store',
    }
  )
); 