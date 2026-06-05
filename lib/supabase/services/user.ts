import { JwtPayload } from "@supabase/supabase-js";
import { createClient } from "../server";

export async function getUserClaims(): Promise<JwtPayload | undefined> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  return data?.claims;
}