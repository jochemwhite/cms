import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Page, PageStore, PageStatus, Section } from '@/types/cms';

export const usePageStore = create<PageStore>()(
  devtools(
    (set, get) => ({
      pages: [],
      currentPage: null,

      // Page management
      addPage: (pageData: Omit<Page, 'id' | 'sections'>) => {
        const newPage: Page = {
          id: uuidv4(),
          ...pageData,
          sections: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        set((state) => ({
          pages: [...state.pages, newPage],
        }), false, 'addPage');
      },

      updatePage: (id: string, data: Partial<Page>) => {
        set((state) => ({
          pages: state.pages.map((page) =>
            page.id === id 
              ? { ...page, ...data, updated_at: new Date().toISOString() }
              : page
          ),
          currentPage: state.currentPage?.id === id 
            ? { ...state.currentPage, ...data, updated_at: new Date().toISOString() }
            : state.currentPage,
        }), false, 'updatePage');
      },

      removePage: (id: string) => {
        set((state) => ({
          pages: state.pages.filter((page) => page.id !== id),
          currentPage: state.currentPage?.id === id ? null : state.currentPage,
        }), false, 'removePage');
      },

      setCurrentPage: (page: Page | null) => {
        set({ currentPage: page }, false, 'setCurrentPage');
      },

      // Page status management
      activatePage: (id: string) => {
        get().setPageStatus(id, 'active');
      },

      archivePage: (id: string) => {
        get().setPageStatus(id, 'archived');
      },

      setPageStatus: (id: string, status: PageStatus) => {
        get().updatePage(id, { status });
      },

      // Schema management per page
      updatePageSchema: (pageId: string, sections: Section[]) => {
        set((state) => ({
          pages: state.pages.map((page) =>
            page.id === pageId 
              ? { ...page, sections, updated_at: new Date().toISOString() }
              : page
          ),
          currentPage: state.currentPage?.id === pageId 
            ? { ...state.currentPage, sections, updated_at: new Date().toISOString() }
            : state.currentPage,
        }), false, 'updatePageSchema');
      },

      getPageSchema: (pageId: string) => {
        const page = get().pages.find(p => p.id === pageId);
        return page?.sections || [];
      },

      // Import/Export
      exportPage: (pageId: string) => {
        const page = get().pages.find(p => p.id === pageId);
        return page || null;
      },

      importPage: (page: Page) => {
        const existingPageIndex = get().pages.findIndex(p => p.id === page.id);
        
        if (existingPageIndex >= 0) {
          // Update existing page
          set((state) => ({
            pages: state.pages.map((p, index) =>
              index === existingPageIndex 
                ? { ...page, updated_at: new Date().toISOString() }
                : p
            ),
          }), false, 'importPage');
        } else {
          // Add new page
          set((state) => ({
            pages: [...state.pages, { ...page, updated_at: new Date().toISOString() }],
          }), false, 'importPage');
        }
      },

      // Website filtering
      getPagesByWebsite: (websiteId: string) => {
        return get().pages.filter(page => page.website_id === websiteId);
      },
    }),
    {
      name: 'page-store',
    }
  )
);

// Helper hook for website-specific page operations
export const usePageHelpers = () => {
  const { pages } = usePageStore();
  
  return {
    isSlugAvailable: (slug: string, websiteId: string, excludePageId?: string) => {
      return !pages.some(page => 
        page.slug === slug && 
        page.website_id === websiteId && 
        page.id !== excludePageId
      );
    },
    
    getPagesByWebsite: (websiteId: string) => {
      return pages.filter(page => page.website_id === websiteId);
    },
    
    getPageBySlug: (slug: string, websiteId: string) => {
      return pages.find(page => page.slug === slug && page.website_id === websiteId);
    },
  };
}; 