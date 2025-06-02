export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          target_user_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_user_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_user_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          error_message: string | null
          html_body: string | null
          id: number
          message_id: string | null
          sent_at: string
          status: string
          subject: string
          text_body: string | null
          to_address: string
        }
        Insert: {
          error_message?: string | null
          html_body?: string | null
          id?: number
          message_id?: string | null
          sent_at?: string
          status: string
          subject: string
          text_body?: string | null
          to_address: string
        }
        Update: {
          error_message?: string | null
          html_body?: string | null
          id?: number
          message_id?: string | null
          sent_at?: string
          status?: string
          subject?: string
          text_body?: string | null
          to_address?: string
        }
        Relationships: []
      }
      global_role_types: {
        Row: {
          description: string
          id: string
          role_name: string
        }
        Insert: {
          description: string
          id?: string
          role_name: string
        }
        Update: {
          description?: string
          id?: string
          role_name?: string
        }
        Relationships: []
      }
      user_global_roles: {
        Row: {
          created_at: string | null
          description: string | null
          global_role_type_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          global_role_type_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          global_role_type_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_global_roles_global_role_type_id_fkey"
            columns: ["global_role_type_id"]
            isOneToOne: false
            referencedRelation: "global_role_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_global_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          is_onboarded: boolean
          last_name: string | null
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          is_onboarded?: boolean
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          is_onboarded?: boolean
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_user_profile_and_assign_role: {
        Args: {
          p_user_id: string
          p_email: string
          p_first_name: string
          p_last_name: string
          p_role_type_id: string
        }
        Returns: boolean
      }
      get_all_users_with_roles: {
        Args: Record<PropertyKey, never>
        Returns: Json[]
      }
      get_user_session: {
        Args: Record<PropertyKey, never> | { p_uid: string }
        Returns: Json
      }
      has_global_role: {
        Args:
          | { role_name_input: string }
          | { uid: string; role_name_input: string }
        Returns: boolean
      }
      revoke_global_role: {
        Args: { user_id_input: string; role_name_input: string }
        Returns: undefined
      }
      set_system_admin: {
        Args: { user_id_input: string }
        Returns: undefined
      }
    }
    Enums: {
      global_roles: "default_user" | "system_admin"
    }
    CompositeTypes: {
      cms_role_type: {
        id: string | null
        role: string | null
      }
      tenant_role_type: {
        tenant_id: string | null
        tenant_role: string | null
      }
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      global_roles: ["default_user", "system_admin"],
    },
  },
} as const
