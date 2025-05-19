import { Database } from "./supabase";

export type UserSession = {
  user_info: Database["public"]["Tables"]["users"]["Row"];
  global_roles: Database["public"]["Tables"]["cms_user_roles"]["Row"][];
  available_tenants: {
    tenant_id: string;
    tenant_name: string;
    tenant_logo: string;
  }[];
};