import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const tokenSchema = z.string().min(32).max(128);

async function hashToken(token: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const loadSave = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: tokenSchema }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("player_saves")
      .select("name,x,y,dir,attacks")
      .eq("token_hash", await hashToken(data.token))
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const saveProgress = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        token: tokenSchema,
        name: z.string().trim().min(1).max(24),
        x: z.number().finite().min(0).max(100000),
        y: z.number().finite().min(0).max(100000),
        dir: z.enum(["up", "down", "left", "right"]),
        attacks: z.number().int().min(0).max(100000000),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { token, ...rest } = data;
    const { error } = await supabaseAdmin
      .from("player_saves")
      .upsert({ token_hash: await hashToken(token), ...rest, updated_at: new Date().toISOString() }, { onConflict: "token_hash" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
