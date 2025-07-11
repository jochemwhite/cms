"use client";

import { useEffect, useState } from "react";
import { useWebsiteStore } from "@/stores/useWebsiteStore";
import { useActiveTenant } from "@/hooks/use-active-tenant";
import { Website } from "@/types/cms";

const ACTIVE_WEBSITE_COOKIE_NAME = "active-website";
const ACTIVE_WEBSITE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function useActiveWebsite() {
  const { activeTenant } = useActiveTenant();
  const { websites, currentWebsite, setCurrentWebsite, getWebsitesByTenant } = useWebsiteStore();
  const [activeWebsite, setActiveWebsiteState] = useState<Website | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Helper function to get cookie value
  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  // Helper function to set cookie
  const setCookie = (name: string, value: string, maxAge: number) => {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
  };

  // Helper function to remove cookie
  const removeCookie = (name: string) => {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=; path=/; max-age=0`;
  };

  // Get available websites for the current tenant
  const availableWebsites = activeTenant ? getWebsitesByTenant(activeTenant.id) : [];

  // Initialize the active website from cookie or fallback to first website
  useEffect(() => {
    if (!activeTenant || availableWebsites.length === 0) {
      setActiveWebsiteState(null);
      setIsInitialized(true);
      return;
    }

    // Try to get from cookie first
    const savedWebsiteId = getCookie(ACTIVE_WEBSITE_COOKIE_NAME);
    
    if (savedWebsiteId) {
      // Find the saved website in the current tenant's websites
      const savedWebsite = availableWebsites.find(website => website.id === savedWebsiteId);
      if (savedWebsite) {
        setActiveWebsiteState(savedWebsite);
        setCurrentWebsite(savedWebsite);
        setIsInitialized(true);
        return;
      }
    }

    // Fallback to first website if no saved website or saved website not found
    const firstWebsite = availableWebsites[0];
    if (firstWebsite) {
      setActiveWebsiteState(firstWebsite);
      setCurrentWebsite(firstWebsite);
      setCookie(ACTIVE_WEBSITE_COOKIE_NAME, firstWebsite.id, ACTIVE_WEBSITE_COOKIE_MAX_AGE);
    }
    setIsInitialized(true);
  }, [activeTenant, availableWebsites, setCurrentWebsite]);

  // Function to set the active website
  const setActiveWebsite = (website: Website | null) => {
    setActiveWebsiteState(website);
    setCurrentWebsite(website);
    if (website) {
      setCookie(ACTIVE_WEBSITE_COOKIE_NAME, website.id, ACTIVE_WEBSITE_COOKIE_MAX_AGE);
    } else {
      removeCookie(ACTIVE_WEBSITE_COOKIE_NAME);
    }
  };

  // Check if tenant has multiple websites
  const hasMultipleWebsites = availableWebsites.length > 1;

  // Get website URL based on domain
  const getWebsiteUrl = (website: Website) => {
    // Handle different domain formats
    if (website.domain.startsWith('http://') || website.domain.startsWith('https://')) {
      return website.domain;
    }
    // Default to https if protocol not specified
    return `https://${website.domain}`;
  };

  return {
    activeWebsite,
    setActiveWebsite,
    availableWebsites,
    hasMultipleWebsites,
    isInitialized,
    getWebsiteUrl,
  };
} 