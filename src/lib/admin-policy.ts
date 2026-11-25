import { z } from "zod";

export const powersSchema = z.object({
  tag: z.string().trim().max(24),
  invisible: z.boolean(),
  giant: z.boolean(),
  flying: z.boolean(),
  noclip: z.boolean(),
});
export type Powers = z.infer<typeof powersSchema>;
export const defaultPowers: Powers = { tag: "", invisible: false, giant: false, flying: false, noclip: false };
export function assertAdmin(role: string | null | undefined) {
  if (role !== "admin") throw new Error("No tienes permiso de administrador.");
}