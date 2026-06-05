"use cache";

import { createClient } from "@/lib/supabase/server";

/**
 * Get cached user claims from Supabase auth
 * Uses Next.js 16+ 'use cache' directive for automatic deduplication
 * within the same request and caching across requests
 */
export async function getUserClaims() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims;
}
