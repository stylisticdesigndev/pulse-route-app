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
      deliveries: {
        Row: {
          completed_at: string | null
          created_at: string
          dropoff_latitude: number | null
          dropoff_longitude: number | null
          failure_reason: string | null
          id: string
          photo_url: string | null
          signature_url: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          stop_id: string
          tracking_number: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          dropoff_latitude?: number | null
          dropoff_longitude?: number | null
          failure_reason?: string | null
          id?: string
          photo_url?: string | null
          signature_url?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          stop_id: string
          tracking_number: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          dropoff_latitude?: number | null
          dropoff_longitude?: number | null
          failure_reason?: string | null
          id?: string
          photo_url?: string | null
          signature_url?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          stop_id?: string
          tracking_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_stop_id_fkey"
            columns: ["stop_id"]
            isOneToOne: false
            referencedRelation: "stops"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_events: {
        Row: {
          attempt: number
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
          attempt?: number
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
          attempt?: number
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
      dispatch_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          read: boolean
          stop_id: string | null
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          kind?: string
          read?: boolean
          stop_id?: string | null
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          read?: boolean
          stop_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_messages_stop_id_fkey"
            columns: ["stop_id"]
            isOneToOne: false
            referencedRelation: "stops"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          avatar_path: string | null
          company: string
          created_at: string
          display_name: string
          driver_code: string
          emergency_contact: string | null
          haptics: boolean
          id: string
          language: string
          nav_preference: string
          phone: string | null
          torch_default: boolean
          units: string
          updated_at: string
          vehicle: string
        }
        Insert: {
          avatar_path?: string | null
          company?: string
          created_at?: string
          display_name: string
          driver_code: string
          emergency_contact?: string | null
          haptics?: boolean
          id?: string
          language?: string
          nav_preference?: string
          phone?: string | null
          torch_default?: boolean
          units?: string
          updated_at?: string
          vehicle?: string
        }
        Update: {
          avatar_path?: string | null
          company?: string
          created_at?: string
          display_name?: string
          driver_code?: string
          emergency_contact?: string | null
          haptics?: boolean
          id?: string
          language?: string
          nav_preference?: string
          phone?: string | null
          torch_default?: boolean
          units?: string
          updated_at?: string
          vehicle?: string
        }
        Relationships: []
      }
      location_logs: {
        Row: {
          driver_id: string
          heading_degrees: number | null
          id: number
          latitude: number
          longitude: number
          recorded_at: string
          route_id: string | null
          speed_mph: number | null
        }
        Insert: {
          driver_id: string
          heading_degrees?: number | null
          id?: number
          latitude: number
          longitude: number
          recorded_at?: string
          route_id?: string | null
          speed_mph?: number | null
        }
        Update: {
          driver_id?: string
          heading_degrees?: number | null
          id?: number
          latitude?: number
          longitude?: number
          recorded_at?: string
          route_id?: string | null
          speed_mph?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "location_logs_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_logs_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          code: string
          delivered: boolean
          description: string | null
          id: string
          kind: string
          returned: boolean
          scanned: boolean
          stop_id: string
          weight_lbs: number | null
        }
        Insert: {
          code: string
          delivered?: boolean
          description?: string | null
          id?: string
          kind: string
          returned?: boolean
          scanned?: boolean
          stop_id: string
          weight_lbs?: number | null
        }
        Update: {
          code?: string
          delivered?: boolean
          description?: string | null
          id?: string
          kind?: string
          returned?: boolean
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
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone_number: string | null
          role: Database["public"]["Enums"]["user_role"]
          vehicle_identifier: string | null
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          vehicle_identifier?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          vehicle_identifier?: string | null
        }
        Relationships: []
      }
      routes: {
        Row: {
          code: string | null
          created_at: string
          dispatcher_id: string | null
          driver_id: string | null
          estimated_duration_minutes: number | null
          id: string
          scheduled_date: string
          status: Database["public"]["Enums"]["route_status"]
          total_distance_miles: number | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          dispatcher_id?: string | null
          driver_id?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          scheduled_date?: string
          status?: Database["public"]["Enums"]["route_status"]
          total_distance_miles?: number | null
        }
        Update: {
          code?: string | null
          created_at?: string
          dispatcher_id?: string | null
          driver_id?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          scheduled_date?: string
          status?: Database["public"]["Enums"]["route_status"]
          total_distance_miles?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_dispatcher_id_fkey"
            columns: ["dispatcher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          break_seconds: number
          break_started_at: string | null
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
          break_seconds?: number
          break_started_at?: string | null
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
          break_seconds?: number
          break_started_at?: string | null
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
          access_notes: string | null
          address: string
          address_line1: string | null
          city: string | null
          completed_at: string | null
          created_at: string
          delivery_window_end: string | null
          delivery_window_start: string | null
          distance_km: number
          drop_instruction: string | null
          eta: string | null
          gate_code: string | null
          hazard_warning: string | null
          id: string
          latitude: number | null
          longitude: number | null
          phone: string | null
          recipient: string
          recipient_name: string | null
          route_id: string | null
          sector: string | null
          seq: number
          sequence_order: number | null
          state: string | null
          status: string
          window_end: string
          window_start: string
          zip_code: string | null
        }
        Insert: {
          access_notes?: string | null
          address: string
          address_line1?: string | null
          city?: string | null
          completed_at?: string | null
          created_at?: string
          delivery_window_end?: string | null
          delivery_window_start?: string | null
          distance_km?: number
          drop_instruction?: string | null
          eta?: string | null
          gate_code?: string | null
          hazard_warning?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          recipient: string
          recipient_name?: string | null
          route_id?: string | null
          sector?: string | null
          seq: number
          sequence_order?: number | null
          state?: string | null
          status?: string
          window_end: string
          window_start: string
          zip_code?: string | null
        }
        Update: {
          access_notes?: string | null
          address?: string
          address_line1?: string | null
          city?: string | null
          completed_at?: string | null
          created_at?: string
          delivery_window_end?: string | null
          delivery_window_start?: string | null
          distance_km?: number
          drop_instruction?: string | null
          eta?: string | null
          gate_code?: string | null
          hazard_warning?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          recipient?: string
          recipient_name?: string | null
          route_id?: string | null
          sector?: string | null
          seq?: number
          sequence_order?: number | null
          state?: string | null
          status?: string
          window_end?: string
          window_start?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_apex_staff: { Args: { _user_id: string }; Returns: boolean }
      is_dispatch_supervisor: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      delivery_status: "pending" | "in_transit" | "delivered" | "failed"
      route_status: "draft" | "assigned" | "active" | "completed"
      user_role: "dispatch_supervisor" | "field_technician"
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
    Enums: {
      delivery_status: ["pending", "in_transit", "delivered", "failed"],
      route_status: ["draft", "assigned", "active", "completed"],
      user_role: ["dispatch_supervisor", "field_technician"],
    },
  },
} as const
