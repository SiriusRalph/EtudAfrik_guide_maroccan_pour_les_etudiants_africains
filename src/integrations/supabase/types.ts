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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_recommendations: {
        Row: {
          created_at: string
          id: string
          match_score: number
          questionnaire_answers: Json | null
          reasons: Json | null
          school_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_score: number
          questionnaire_answers?: Json | null
          reasons?: Json | null
          school_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_score?: number
          questionnaire_answers?: Json | null
          reasons?: Json | null
          school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id?: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          name: string
          order_id: string
          price: number
          quantity: number
        }
        Insert: {
          id?: string
          name: string
          order_id: string
          price: number
          quantity?: number
        }
        Update: {
          id?: string
          name?: string
          order_id?: string
          price?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          id: string
          status: Database["public"]["Enums"]["order_status"]
          table_number: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["order_status"]
          table_number: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["order_status"]
          table_number?: number
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          budget_max: number | null
          budget_min: number | null
          city: string | null
          country: string | null
          created_at: string
          desired_city: string | null
          desired_field: string | null
          education_level: string | null
          full_name: string | null
          id: string
          phone: string | null
          preferred_language: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          budget_max?: number | null
          budget_min?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          desired_city?: string | null
          desired_field?: string | null
          education_level?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          budget_max?: number | null
          budget_min?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          desired_city?: string | null
          desired_field?: string | null
          education_level?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          created_at: string
          description: string | null
          domain: string
          duration_months: number | null
          id: string
          is_active: boolean | null
          language: string | null
          level: string
          name: string
          requirements: string | null
          school_id: string
          tuition_yearly: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          domain: string
          duration_months?: number | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          level: string
          name: string
          requirements?: string | null
          school_id: string
          tuition_yearly?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          domain?: string
          duration_months?: number | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          level?: string
          name?: string
          requirements?: string | null
          school_id?: string
          tuition_yearly?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          ai_summary: string | null
          comment: string | null
          created_at: string
          facilities_rating: number | null
          id: string
          internship_opportunities: number | null
          is_verified: boolean | null
          rating: number
          school_id: string
          sentiment_score: number | null
          student_life: number | null
          teaching_quality: number | null
          title: string | null
          updated_at: string
          user_id: string
          value_for_money: number | null
        }
        Insert: {
          ai_summary?: string | null
          comment?: string | null
          created_at?: string
          facilities_rating?: number | null
          id?: string
          internship_opportunities?: number | null
          is_verified?: boolean | null
          rating: number
          school_id: string
          sentiment_score?: number | null
          student_life?: number | null
          teaching_quality?: number | null
          title?: string | null
          updated_at?: string
          user_id: string
          value_for_money?: number | null
        }
        Update: {
          ai_summary?: string | null
          comment?: string | null
          created_at?: string
          facilities_rating?: number | null
          id?: string
          internship_opportunities?: number | null
          is_verified?: boolean | null
          rating?: number
          school_id?: string
          sentiment_score?: number | null
          student_life?: number | null
          teaching_quality?: number | null
          title?: string | null
          updated_at?: string
          user_id?: string
          value_for_money?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_schools: {
        Row: {
          created_at: string
          id: string
          school_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          school_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_schools_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_groups: {
        Row: {
          created_at: string
          description: string | null
          founded_year: number | null
          id: string
          logo_url: string | null
          name: string
          slug: string
          total_student_count: number | null
          type: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          founded_year?: number | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          total_student_count?: number | null
          type?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          founded_year?: number | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          total_student_count?: number | null
          type?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      schools: {
        Row: {
          accreditations: string[] | null
          address: string | null
          admin_user_id: string | null
          category: string | null
          city: string
          cover_url: string | null
          created_at: string
          description: string | null
          email: string | null
          facilities: string[] | null
          founded_year: number | null
          group_id: string | null
          id: string
          international_student_count: number | null
          is_featured: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          logo_url: string | null
          name: string
          phone: string | null
          satisfaction_score: number | null
          slug: string
          student_count: number | null
          type: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          accreditations?: string[] | null
          address?: string | null
          admin_user_id?: string | null
          category?: string | null
          city: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          facilities?: string[] | null
          founded_year?: number | null
          group_id?: string | null
          id?: string
          international_student_count?: number | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          logo_url?: string | null
          name: string
          phone?: string | null
          satisfaction_score?: number | null
          slug: string
          student_count?: number | null
          type?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          accreditations?: string[] | null
          address?: string | null
          admin_user_id?: string | null
          category?: string | null
          city?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          facilities?: string[] | null
          founded_year?: number | null
          group_id?: string | null
          id?: string
          international_student_count?: number | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          satisfaction_score?: number | null
          slug?: string
          student_count?: number | null
          type?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schools_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "school_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "school_admin" | "admin"
      order_status: "received" | "preparing" | "ready" | "served"
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
      app_role: ["student", "school_admin", "admin"],
      order_status: ["received", "preparing", "ready", "served"],
    },
  },
} as const
