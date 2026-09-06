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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      delivery_events: {
        Row: {
          created_at: string
          event_type: string
          gps: string | null
          id: string
          notes: string | null
          photo_captured: boolean
          proximity_m: number | null
          reason: string | null
          shift_id: string | null
          signature_path: string | null
          stop_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          gps?: string | null
          id?: string
          notes?: string | null
          photo_captured?: boolean
          proximity_m?: number | null
          reason?: string | null
          shift_id?: string | null
          signature_path?: string | null
          stop_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          gps?: string | null
          id?: string
          notes?: string | null
          photo_captured?: boolean
          proximity_m?: number | null
          reason?: string | null
          shift_id?: string | null
          signature_path?: string | null
          stop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_events_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_events_stop_id_fkey"
            columns: ["stop_id"]
            isOneToOne: false
            referencedRelation: "stops"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          code: string
          description: string | null
          id: string
          kind: string
          scanned: boolean
          stop_id: string
          weight_lbs: number | null
        }
        Insert: {
          code: string
          description?: string | null
          id?: string
          kind: string
          scanned?: boolean
          stop_id: string
          weight_lbs?: number | null
        }
        Update: {
          code?: string
          description?: string | null
          id?: string
          kind?: string
          scanned?: boolean
          stop_id?: string
          weight_lbs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "packages_stop_id_fkey"
            columns: ["stop_id"]
            isOneToOne: false
            referencedRelation: "stops"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          driver_code: string
          driver_name: string
          ended_at: string | null
          id: string
          manifest_code: string
          odometer_end: number | null
          odometer_start: number | null
          started_at: string
          status: string
          vehicle: string
        }
        Insert: {
          driver_code: string
          driver_name: string
          ended_at?: string | null
          id?: string
          manifest_code: string
          odometer_end?: number | null
          odometer_start?: number | null
          started_at?: string
          status?: string
          vehicle: string
        }
        Update: {
          driver_code?: string
          driver_name?: string
          ended_at?: string | null
          id?: string
          manifest_code?: string
          odometer_end?: number | null
          odometer_start?: number | null
          started_at?: string
          status?: string
          vehicle?: string
        }
        Relationships: []
      }
      stops: {
        Row: {
          address: string
          completed_at: string | null
          created_at: string
          distance_km: number
          drop_instruction: string | null
          eta: string | null
          gate_code: string | null
          hazard_warning: string | null
          id: string
          phone: string | null
          recipient: string
          sector: string | null
          seq: number
          status: string
          window_end: string
          window_start: string
        }
        Insert: {
          address: string
          completed_at?: string | null
          created_at?: string
          distance_km?: number
          drop_instruction?: string | null
          eta?: string | null
          gate_code?: string | null
          hazard_warning?: string | null
          id?: string
          phone?: string | null
          recipient: string
          sector?: string | null
          seq: number
          status?: string
          window_end: string
          window_start: string
        }
        Update: {
          address?: string
          completed_at?: string | null
          created_at?: string
          distance_km?: number
          drop_instruction?: string | null
          eta?: string | null
          gate_code?: string | null
          hazard_warning?: string | null
          id?: string
          phone?: string | null
          recipient?: string
          sector?: string | null
          seq?: number
          status?: string
          window_end?: string
          window_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
