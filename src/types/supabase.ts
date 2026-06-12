export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TaskStatus = Database["public"]["Enums"]["task_status"];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      tasks: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          description: string | null;
          due_date: string | null;
          id: string;
          parent_task_id: string | null;
          position: string;
          priority: number | null;
          status: TaskStatus;
          title: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          parent_task_id?: string | null;
          position?: string | null;
          priority?: number | null;
          status?: string;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          parent_task_id?: string | null;
          position?: string | null;
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
