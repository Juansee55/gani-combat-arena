import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin, defaultPowers, powersSchema } from "./admin-policy";

export const getAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [profile, role, powers] = await Promise.all([
      context.supabase.from("profiles").select("display_name,avatar_url").eq("id", context.userId).maybeSingle(),
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle(),
      context.supabase.from("admin_powers").select("tag,invisible,giant,flying,noclip").eq("user_id", context.userId).maybeSingle(),
    ]);
    if (profile.error || role.error || powers.error) throw new Error("No se pudo cargar la cuenta.");
    return { profile: profile.data, isAdmin: role.data?.role === "admin", powers: powers.data ?? defaultPowers };
  });

export const setPowers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => powersSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { data: role, error } = await context.supabase.from("user_roles").select("role")
      .eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (error) throw new Error("No se pudo comprobar el permiso.");
    assertAdmin(role?.role);
    const result = await context.supabase.from("admin_powers").upsert({ user_id: context.userId, ...data })
      .select("tag,invisible,giant,flying,noclip").single();
    if (result.error) throw new Error("No se pudieron guardar los poderes.");
    return result.data;
  });

export const setProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ display_name: z.string().trim().min(1).max(24), avatar_url: z.union([z.literal(""), z.url().refine((url) => url.startsWith("https://"))]) }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("profiles").upsert({ id: context.userId, ...data });
    if (error) throw new Error("No se pudo guardar el perfil.");
    return data;
  });