import { TaskStatus } from "@/types/supabase";

export const taskStatus = {
  active: "active",
  done: "done",
  archived: "archived",
} as const satisfies Record<string, TaskStatus>;
