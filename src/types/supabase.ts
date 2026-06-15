export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TaskStatus = Database["public"]["Enums"]["task_status"];
export type AiGeneration = Database["public"]["Tables"]["ai_generations"];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      ai_generations: {
        Row: {
          duration_ms: number | null;
          error_code: string | null;
          feature: string | null;
          finished_at: string | null;
          id: string;
          input_tokens: number | null;
          model: string | null;
          output_tokens: number | null;
          prompt: string | null;
          prompt_version: string | null;
          response: string | null;
          started_at: string | null;
          status: string | null;
          task_id: string;
          total_tokens: number | null;
          user_id: string | null;
        };
        Insert: {
          duration_ms?: number | null;
          error_code?: string | null;
          feature?: string | null;
          finished_at?: string | null;
          id?: string;
          input_tokens?: number | null;
          model?: string | null;
          output_tokens?: number | null;
          prompt?: string | null;
          prompt_version?: string | null;
          response?: string | null;
          started_at?: string | null;
          status?: string | null;
          task_id: string;
          total_tokens?: number | null;
          user_id?: string | null;
        };
        Update: {
          duration_ms?: number | null;
          error_code?: string | null;
          feature?: string | null;
          finished_at?: string | null;
          id?: string;
          input_tokens?: number | null;
          model?: string | null;
          output_tokens?: number | null;
          prompt?: string | null;
          prompt_version?: string | null;
          response?: string | null;
          started_at?: string | null;
          status?: string | null;
          task_id?: string;
          total_tokens?: number | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_generations_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          ai_locked: boolean | null;
          completed_at: string | null;
          created_at: string | null;
          description: string | null;
          due_date: string | null;
          id: string;
          parent_task_id: string | null;
          position: string;
          priority: number | null;
          status: string;
          title: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          ai_locked?: boolean | null;
          completed_at?: string | null;
          created_at?: string | null;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          parent_task_id?: string | null;
          position?: string;
          priority?: number | null;
          status?: string;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Update: {
          ai_locked?: boolean | null;
          completed_at?: string | null;
          created_at?: string | null;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          parent_task_id?: string | null;
          position?: string;
          priority?: number | null;
          status?: string;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_parent_task_id_fkey";
            columns: ["parent_task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_last_position: { Args: { p_parent_id?: string }; Returns: string };
    };
    Enums: {
      task_status: "active" | "done" | "archived";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
