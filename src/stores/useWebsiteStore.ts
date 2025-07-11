import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Website, WebsiteStore } from '@/types/cms';

export const useWebsiteStore = create<WebsiteStore>()(
  devtools(
    (set, get) => ({
      websites: [],
      currentWebsite: null,

      // Website management
      addWebsite: (websiteData: Omit<Website, 'id' | 'pages'>) => {
        const newWebsite: Website = {
          id: uuidv4(),
          ...websiteData,
          pages: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        set((state) => ({
          websites: [...state.websites, newWebsite],
        }), false, 'addWebsite');
      },

      updateWebsite: (id: string, data: Partial<Website>) => {
        set((state) => ({
          websites: state.websites.map((website) =>
            website.id === id 
              ? { ...website, ...data, updated_at: new Date().toISOString() }
              : website
          ),
          currentWebsite: state.currentWebsite?.id === id 
            ? { ...state.currentWebsite, ...data, updated_at: new Date().toISOString() }
            : state.currentWebsite,
        }), false, 'updateWebsite');
      },

      removeWebsite: (id: string) => {
        set((state) => ({
          websites: state.websites.filter((website) => website.id !== id),
          currentWebsite: state.currentWebsite?.id === id ? null : state.currentWebsite,
        }), false, 'removeWebsite');
      },

      setCurrentWebsite: (website: Website | null) => {
        set({ currentWebsite: website }, false, 'setCurrentWebsite');
      },

      // Website status management
      setWebsiteStatus: (id: string, status: Website['status']) => {
        get().updateWebsite(id, { status });
      },

      // Get websites by tenant
      getWebsitesByTenant: (tenantId: string) => {
        return get().websites.filter(website => website.tenant_id === tenantId);
      },
    }),
    {
      name: 'website-store',
    }
  )
); 