export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      action_tokens: {
        Row: {
          booking_id: string
          created_at: string | null
          expires_at: string
          token: string
          type: string
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          expires_at: string
          token: string
          type: string
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          expires_at?: string
          token?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_tokens_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      availability_rules: {
        Row: {
          day_of_week: number
          end_time_local: string
          id: string
          provider_id: string
          start_time_local: string
        }
        Insert: {
          day_of_week: number
          end_time_local: string
          id?: string
          provider_id: string
          start_time_local: string
        }
        Update: {
          day_of_week?: number
          end_time_local?: string
          id?: string
          provider_id?: string
          start_time_local?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_rules_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_settings: {
        Row: {
          buffer_after_minutes: number | null
          buffer_before_minutes: number | null
          default_buffer_minutes: number | null
          default_cancellation_policy: string | null
          horizon_days: number | null
          min_notice_minutes: number | null
          provider_id: string
        }
        Insert: {
          buffer_after_minutes?: number | null
          buffer_before_minutes?: number | null
          default_buffer_minutes?: number | null
          default_cancellation_policy?: string | null
          horizon_days?: number | null
          min_notice_minutes?: number | null
          provider_id: string
        }
        Update: {
          buffer_after_minutes?: number | null
          buffer_before_minutes?: number | null
          default_buffer_minutes?: number | null
          default_cancellation_policy?: string | null
          horizon_days?: number | null
          min_notice_minutes?: number | null
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_settings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          client_email: string
          client_name: string
          client_phone: string
          created_at: string | null
          end_at: string
          id: string
          meeting_location: string | null
          notes: string | null
          provider_id: string
          service_id: string
          start_at: string
          status: string
        }
        Insert: {
          client_email: string
          client_name: string
          client_phone: string
          created_at?: string | null
          end_at: string
          id?: string
          meeting_location?: string | null
          notes?: string | null
          provider_id: string
          service_id: string
          start_at: string
          status: string
        }
        Update: {
          client_email?: string
          client_name?: string
          client_phone?: string
          created_at?: string | null
          end_at?: string
          id?: string
          meeting_location?: string | null
          notes?: string | null
          provider_id?: string
          service_id?: string
          start_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      busy_blocks: {
        Row: {
          created_at: string | null
          end_at: string
          id: string
          provider_id: string
          repeat_type: string | null
          start_at: string
          title: string | null
        }
        Insert: {
          created_at?: string | null
          end_at: string
          id?: string
          provider_id: string
          repeat_type?: string | null
          start_at: string
          title?: string | null
        }
        Update: {
          created_at?: string | null
          end_at?: string
          id?: string
          provider_id?: string
          repeat_type?: string | null
          start_at?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "busy_blocks_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cancellation_policy_text: string | null
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          timezone: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cancellation_policy_text?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          timezone?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cancellation_policy_text?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          timezone?: string | null
          username?: string
        }
        Relationships: []
      }
      reschedule_options: {
        Row: {
          end_at: string
          id: string
          proposal_id: string
          start_at: string
        }
        Insert: {
          end_at: string
          id?: string
          proposal_id: string
          start_at: string
        }
        Update: {
          end_at?: string
          id?: string
          proposal_id?: string
          start_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reschedule_options_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "reschedule_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      reschedule_proposals: {
        Row: {
          booking_id: string
          created_at: string | null
          expires_at: string
          id: string
          provider_id: string
          status: string
          token: string
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          provider_id: string
          status: string
          token: string
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          provider_id?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "reschedule_proposals_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reschedule_proposals_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          buffer_minutes: number | null
          cancellation_policy: string | null
          created_at: string | null
          default_location: string | null
          deleted_at: string | null
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          location_details: string | null
          location_type: string | null
          name: string
          price_cents: number | null
          price_negotiable: boolean | null
          provider_id: string
        }
        Insert: {
          buffer_minutes?: number | null
          cancellation_policy?: string | null
          created_at?: string | null
          default_location?: string | null
          deleted_at?: string | null
          description?: string | null
          duration_minutes: number
          id?: string
          is_active?: boolean | null
          location_details?: string | null
          location_type?: string | null
          name: string
          price_cents?: number | null
          price_negotiable?: boolean | null
          provider_id: string
        }
        Update: {
          buffer_minutes?: number | null
          cancellation_policy?: string | null
          created_at?: string | null
          default_location?: string | null
          deleted_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          location_details?: string | null
          location_type?: string | null
          name?: string
          price_cents?: number | null
          price_negotiable?: boolean | null
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      confirm_reschedule: {
        Args: { p_option_id: string; p_token: string }
        Returns: Json
      }
      create_booking: {
        Args: {
          p_client_email: string
          p_client_name: string
          p_client_phone: string
          p_notes?: string
          p_provider_id: string
          p_service_id: string
          p_start_at: string
        }
        Returns: Json
      }
      create_service_with_settings: {
        Args: {
          p_buffer_minutes: number
          p_cancellation_policy: string
          p_default_location: string
          p_description: string
          p_duration_minutes: number
          p_location_type: string
          p_name: string
          p_price_cents: number
          p_price_negotiable: boolean
          p_provider_id: string
        }
        Returns: string
      }
      update_service_with_settings: {
        Args: {
          p_buffer_minutes: number
          p_cancellation_policy: string
          p_default_location: string
          p_description: string
          p_duration_minutes: number
          p_is_active: boolean
          p_location_type: string
          p_name: string
          p_price_cents: number
          p_price_negotiable: boolean
          p_provider_id: string
          p_service_id: string
        }
        Returns: boolean
      }
      uuid_generate_v1: { Args: never; Returns: string }
      uuid_generate_v1mc: { Args: never; Returns: string }
      uuid_generate_v3: {
        Args: { name: string; namespace: string }
        Returns: string
      }
      uuid_generate_v4: { Args: never; Returns: string }
      uuid_generate_v5: {
        Args: { name: string; namespace: string }
        Returns: string
      }
      uuid_nil: { Args: never; Returns: string }
      uuid_ns_dns: { Args: never; Returns: string }
      uuid_ns_oid: { Args: never; Returns: string }
      uuid_ns_url: { Args: never; Returns: string }
      uuid_ns_x500: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
