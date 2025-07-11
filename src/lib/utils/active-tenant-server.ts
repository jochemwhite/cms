import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { UserSession } from "@/types/custom-supabase-types";

const ACTIVE_TENANT_COOKIE_NAME = "active-tenant";

type Tenant = UserSession["tenants"][0];

/**
 * Get the active tenant ID from cookies in server actions
 * @returns The active tenant ID or null if not found
 */
export async function getActiveTenantId(): Promise<string | null> {
  const cookieStore = await cookies();
  const tenantCookie = cookieStore.get(ACTIVE_TENANT_COOKIE_NAME);
  return tenantCookie?.value || null;
}

/**
 * Get the full active tenant object from cookies in server actions
 * Requires the user to be authenticated and have access to the tenant
 * @returns The active tenant object or null if not found/accessible
 */
export async function getActiveTenant(): Promise<Tenant | null> {
  const tenantId = await getActiveTenantId();
  
  if (!tenantId) {
    return null;
  }

  const supabase = await createClient();
  
  try {
    // Get the user's session to ensure they have access to this tenant
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    // Get user session with tenants
    const { data: userSession, error } = await supabase.rpc("get_user_session", {
      p_uid: user.id,
    });

    if (error || !userSession) {
      console.error("Error fetching user session:", error);
      return null;
    }

    const session = userSession as UserSession;
    
    // Find the tenant in the user's accessible tenants
    const activeTenant = session.tenants?.find(tenant => tenant.id === tenantId);
    
    return activeTenant || null;
    
  } catch (error) {
    console.error("Error getting active tenant:", error);
    return null;
  }
}

/**
 * Set the active tenant cookie in server actions
 * @param tenantId The tenant ID to set as active
 */
export async function setActiveTenantId(tenantId: string): Promise<void> {
  const cookieStore = await cookies();
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  
  cookieStore.set(ACTIVE_TENANT_COOKIE_NAME, tenantId, {
    path: "/",
    maxAge,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

/**
 * Remove the active tenant cookie in server actions
 */
export async function removeActiveTenantId(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_TENANT_COOKIE_NAME);
} 