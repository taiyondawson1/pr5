export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      account_metrics: {
        Row: {
          account_number: string
          average_loss: number | null
          average_win: number | null
          balance: number | null
          created_at: string
          equity: number | null
          floating: number | null
          free_margin: number | null
          id: string
          margin: number | null
          margin_level: number | null
          max_drawdown: number | null
          open_positions: number | null
          profit_factor: number | null
          total_orders: number | null
          user_id: string
          win_rate: number | null
        }
        Insert: {
          account_number: string
          average_loss?: number | null
          average_win?: number | null
          balance?: number | null
          created_at?: string
          equity?: number | null
          floating?: number | null
          free_margin?: number | null
          id?: string
          margin?: number | null
          margin_level?: number | null
          max_drawdown?: number | null
          open_positions?: number | null
          profit_factor?: number | null
          total_orders?: number | null
          user_id: string
          win_rate?: number | null
        }
        Update: {
          account_number?: string
          average_loss?: number | null
          average_win?: number | null
          balance?: number | null
          created_at?: string
          equity?: number | null
          floating?: number | null
          free_margin?: number | null
          id?: string
          margin?: number | null
          margin_level?: number | null
          max_drawdown?: number | null
          open_positions?: number | null
          profit_factor?: number | null
          total_orders?: number | null
          user_id?: string
          win_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "account_metrics_account_number_fkey"
            columns: ["account_number"]
            isOneToOne: false
            referencedRelation: "mt4_accounts"
            referencedColumns: ["account_number"]
          },
        ]
      }
      customer_accounts: {
        Row: {
          accounts_locked: boolean | null
          can_add_accounts: boolean | null
          can_remove_accounts: boolean | null
          created_at: string
          email: string
          enrolled_by: string | null
          enroller: string | null
          id: string
          license_key: string | null
          max_accounts: number | null
          name: string
          phone: string | null
          referred_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accounts_locked?: boolean | null
          can_add_accounts?: boolean | null
          can_remove_accounts?: boolean | null
          created_at?: string
          email: string
          enrolled_by?: string | null
          enroller?: string | null
          id?: string
          license_key?: string | null
          max_accounts?: number | null
          name: string
          phone?: string | null
          referred_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accounts_locked?: boolean | null
          can_add_accounts?: boolean | null
          can_remove_accounts?: boolean | null
          created_at?: string
          email?: string
          enrolled_by?: string | null
          enroller?: string | null
          id?: string
          license_key?: string | null
          max_accounts?: number | null
          name?: string
          phone?: string | null
          referred_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          email: string
          enrolled_by: string | null
          enroller: string | null
          id: string
          name: string
          phone: string | null
          referred_by: string | null
          revenue: string
          sales_rep_id: string
          staff_key: string | null
          status: string
          test: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          enrolled_by?: string | null
          enroller?: string | null
          id?: string
          name: string
          phone?: string | null
          referred_by?: string | null
          revenue?: string
          sales_rep_id: string
          staff_key?: string | null
          status?: string
          test?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          enrolled_by?: string | null
          enroller?: string | null
          id?: string
          name?: string
          phone?: string | null
          referred_by?: string | null
          revenue?: string
          sales_rep_id?: string
          staff_key?: string | null
          status?: string
          test?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      license_keys: {
        Row: {
          account_numbers: string[]
          accounts_locked: boolean | null
          can_add_accounts: boolean | null
          can_remove_accounts: boolean | null
          created_at: string | null
          email: string
          enrolled_by: string | null
          enroller: string | null
          expiry_date: string | null
          id: string
          license_key: string
          max_accounts: number | null
          name: string
          phone: string
          product_code: string
          referred_by: string | null
          staff_id: string | null
          staff_key: string | null
          status: string | null
          subscription_type: string
          test: string | null
          user_id: string
        }
        Insert: {
          account_numbers: string[]
          accounts_locked?: boolean | null
          can_add_accounts?: boolean | null
          can_remove_accounts?: boolean | null
          created_at?: string | null
          email: string
          enrolled_by?: string | null
          enroller?: string | null
          expiry_date?: string | null
          id?: string
          license_key: string
          max_accounts?: number | null
          name: string
          phone?: string
          product_code: string
          referred_by?: string | null
          staff_id?: string | null
          staff_key?: string | null
          status?: string | null
          subscription_type: string
          test?: string | null
          user_id: string
        }
        Update: {
          account_numbers?: string[]
          accounts_locked?: boolean | null
          can_add_accounts?: boolean | null
          can_remove_accounts?: boolean | null
          created_at?: string | null
          email?: string
          enrolled_by?: string | null
          enroller?: string | null
          expiry_date?: string | null
          id?: string
          license_key?: string
          max_accounts?: number | null
          name?: string
          phone?: string
          product_code?: string
          referred_by?: string | null
          staff_id?: string | null
          staff_key?: string | null
          status?: string | null
          subscription_type?: string
          test?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mt4_accounts: {
        Row: {
          account_name: string | null
          account_number: string
          chart_suffix: string | null
          created_at: string
          id: string
          password: string
          platform: string | null
          server: string
          user_id: string
        }
        Insert: {
          account_name?: string | null
          account_number: string
          chart_suffix?: string | null
          created_at?: string
          id?: string
          password: string
          platform?: string | null
          server: string
          user_id: string
        }
        Update: {
          account_name?: string | null
          account_number?: string
          chart_suffix?: string | null
          created_at?: string
          id?: string
          password?: string
          platform?: string | null
          server?: string
          user_id?: string
        }
        Relationships: []
      }
      mt4_logs: {
        Row: {
          account_number: string
          created_at: string
          id: string
          log_message: string
          log_type: string
          user_id: string
        }
        Insert: {
          account_number: string
          created_at?: string
          id?: string
          log_message: string
          log_type: string
          user_id: string
        }
        Update: {
          account_number?: string
          created_at?: string
          id?: string
          log_message?: string
          log_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt4_logs_account_number_fkey"
            columns: ["account_number"]
            isOneToOne: false
            referencedRelation: "mt4_accounts"
            referencedColumns: ["account_number"]
          },
        ]
      }
      myfxbook_sessions: {
        Row: {
          created_at: string
          email: string
          id: string
          session: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          session: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          session?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          product_code: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          product_code: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          product_code?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          enrolled_by: string | null
          enroller: string | null
          id: string
          referral_code: string | null
          referred_by: string | null
          role: Database["public"]["Enums"]["user_role"]
          staff_key: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enrolled_by?: string | null
          enroller?: string | null
          id: string
          referral_code?: string | null
          referred_by?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          staff_key?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enrolled_by?: string | null
          enroller?: string | null
          id?: string
          referral_code?: string | null
          referred_by?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          staff_key?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          amount: number
          created_at: string
          customer_id: string
          date: string
          id: string
          product_name: string | null
          sales_rep_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id: string
          date?: string
          id?: string
          product_name?: string | null
          sales_rep_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          date?: string
          id?: string
          product_name?: string | null
          sales_rep_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_keys: {
        Row: {
          affiliate_deal_percent: number | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          key: string
          name: string | null
          password: string | null
          role: string
          status: string
          user_id: string | null
        }
        Insert: {
          affiliate_deal_percent?: number | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          key: string
          name?: string | null
          password?: string | null
          role: string
          status?: string
          user_id?: string | null
        }
        Update: {
          affiliate_deal_percent?: number | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          key?: string
          name?: string | null
          password?: string | null
          role?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      trades: {
        Row: {
          account_number: string
          created_at: string
          duration: string | null
          entry_date: string
          exit_date: string
          id: string
          result: number
          size: number
          symbol: string
          trader_name: string | null
          type: string
          user_id: string
        }
        Insert: {
          account_number: string
          created_at?: string
          duration?: string | null
          entry_date: string
          exit_date: string
          id?: string
          result: number
          size: number
          symbol: string
          trader_name?: string | null
          type: string
          user_id: string
        }
        Update: {
          account_number?: string
          created_at?: string
          duration?: string | null
          entry_date?: string
          exit_date?: string
          id?: string
          result?: number
          size?: number
          symbol?: string
          trader_name?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_account_number_fkey"
            columns: ["account_number"]
            isOneToOne: false
            referencedRelation: "mt4_accounts"
            referencedColumns: ["account_number"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_role: {
        Args: { role_to_check: string }
        Returns: boolean
      }
      cleanup_all_customer_staff_keys: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_profile_with_role: {
        Args: { user_id: string; role_name: string; staff_key_value: string }
        Returns: undefined
      }
      ensure_user_profile: {
        Args: { user_id: string; user_role: string; user_staff_key: string }
        Returns: undefined
      }
      execute_admin_query: {
        Args: { query_text: string }
        Returns: undefined
      }
      generate_random_6digit: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_random_license_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_unique_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_id_from_account: {
        Args: { account_number: string }
        Returns: string
      }
      is_staff_manager: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      repair_missing_customer_records: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_expired_licenses: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_user_referral_codes: {
        Args: { user_id: string; referral_code: string }
        Returns: undefined
      }
    }
    Enums: {
      user_role: "ceo" | "admin" | "enroller" | "customer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["ceo", "admin", "enroller", "customer"],
    },
  },
} as const
