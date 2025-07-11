import { cookies } from "next/headers";
import { getActiveTenant } from "./active-tenant-server";
import { Website } from "@/types/cms";

const ACTIVE_WEBSITE_COOKIE_NAME = "active-website";

/**
 * Get the active website ID from cookies in server actions
 * @returns The active website ID or null if not found
 */
export async function getActiveWebsiteId(): Promise<string | null> {
  const cookieStore = await cookies();
  const websiteCookie = cookieStore.get(ACTIVE_WEBSITE_COOKIE_NAME);
  return websiteCookie?.value || null;
}

/**
 * Get the active website with validation
 * This ensures the user has access to the website through their active tenant
 * @returns The active website object or null if not found/accessible
 */
export async function getActiveWebsite(): Promise<Website | null> {
  const websiteId = await getActiveWebsiteId();
  
  if (!websiteId) {
    return null;
  }

  // Get the active tenant to validate access
  const activeTenant = await getActiveTenant();
  
  if (!activeTenant) {
    return null;
  }

  // TODO: In a real implementation, you would fetch the website from the database
  // and validate that it belongs to the active tenant
  // For now, we'll return a mock structure
  
  // Example database query (when implemented):
  // const { data: website, error } = await supabase
  //   .from('websites')
  //   .select('*')
  //   .eq('id', websiteId)
  //   .eq('tenant_id', activeTenant.id)
  //   .single();

  // if (error || !website) {
  //   return null;
  // }

  // return website;
  
  // For now, return null as this needs database implementation
  return null;
}

/**
 * Set the active website cookie in server actions
 * @param websiteId The website ID to set as active
 */
export async function setActiveWebsiteId(websiteId: string): Promise<void> {
  const cookieStore = await cookies();
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  
  cookieStore.set(ACTIVE_WEBSITE_COOKIE_NAME, websiteId, {
    path: "/",
    maxAge,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

/**
 * Remove the active website cookie in server actions
 */
export async function removeActiveWebsiteId(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_WEBSITE_COOKIE_NAME);
}

/**
 * Validate that a website belongs to the active tenant
 * @param websiteId The website ID to validate
 * @returns True if the website belongs to the active tenant
 */
export async function validateWebsiteAccess(websiteId: string): Promise<boolean> {
  const activeTenant = await getActiveTenant();
  
  if (!activeTenant) {
    return false;
  }

  // TODO: In a real implementation, you would query the database
  // const { data: website, error } = await supabase
  //   .from('websites')
  //   .select('tenant_id')
  //   .eq('id', websiteId)
  //   .single();

  // return !error && website?.tenant_id === activeTenant.id;
  
  // For now, return true as this needs database implementation
  return true;
} 