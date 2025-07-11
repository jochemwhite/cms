import { Database } from "./supabase";

export type UserSession = {
  user_info: Database["public"]["Tables"]["users"]["Row"];
  global_roles: string[];
  tenants: {
    id: string;
    name: string;
    logo_url: string;
    website: string
  }[];
};

export interface UserForProvider {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  avatar: string | null;
  is_onboarded: boolean;
  roles: Array<{
    assignment_id: string;
    role_type_id: string;
    role_name: string;
    role_description: string;
  }>;
}

// --- Available Roles ---

export interface AvailableRole {
  id: string;
  role_name: string;
  description: string;
}