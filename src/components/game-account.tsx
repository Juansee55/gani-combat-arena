import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Shield, UserRound, X, LogOut, Save, EyeOff, Maximize, Feather, BrickWall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { getAccount, setPowers, setProfile } from "@/lib/account.functions";
import { defaultPowers, type Powers } from "@/lib/admin-policy";

export type GameAccount = Awaited<ReturnType<typeof getAccount>>;
const abilities = [
  { key: "invisible", label: "Invisible", icon: EyeOff },
  { key: "giant", label: "Gigante", icon: Maximize },
  { key: "flying", label: "Volar", icon: Feather },
  { key: "noclip", label: "Atravesar paredes", icon: BrickWall },
] as const;

export function GameAccountPanel({ onChange }: { onChange: (account: GameAccount | null) => void }) {
  const fetchAccount = useServerFn(getAccount);
  const savePowers = useServerFn(setPowers);
  const saveProfile = useServerFn(setProfile);
  const [account, setAccount] = useState<GameAccount | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [name, setName] = useState("Jugador");
  const [avatar, setAvatar] = useState("");
  const [tag, setTag] = useState("");
  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) { setAccount(null); onChange(null); return; }
    try {
      const next = await fetchAccount();
      setAccount(next); onChange(next);
      setName(next.profile?.display_name ?? "Jugador");
      setAvatar(next.profile?.avatar_url ?? ""); setTag(next.powers.tag);
    } catch { setError("No se pudo cargar tu cuenta. Vuelve a intentarlo."); }
  }, [fetchAccount, onChange]);
  useEffect(() => {
    void refresh();
    const listener = () => { void refresh(); };
    window.addEventListener("game:account-change", listener);
    return () => window.removeEventListener("game:account-change", listener);
  }, [refresh]);

  async function login(provider: "google" | "lovable") {
    setBusy(true); setError("");
    try {
      const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
      if (result.error) throw result.error;
      if (!result.redirected) await refresh();
    } catch { setError("No se pudo iniciar sesión. Inténtalo de nuevo."); }
    finally { setBusy(false); }
  }
  async function updatePowers(next: Powers) {
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await savePowers({ data: next });
      if (account) { const updated = { ...account, powers: result }; setAccount(updated); onChange(updated); }
      setNotice("Poderes guardados");
    } catch { setError("No se pudo aplicar el cambio. Comprueba tu permiso de administrador."); }
    finally { setBusy(false); }
  }
  return <>
    <Button variant="secondary" size="icon" className="fixed right-3 top-48 z-40 border border-border shadow-lg" title={account?.isAdmin ? "Administración" : "Cuenta"} aria-label={account?.isAdmin ? "Administración" : "Cuenta"} onClick={() => { setOpen(true); void refresh(); }}>
      {account?.isAdmin ? <Shield /> : <UserRound />}
    </Button>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4" role="dialog" aria-modal="true" aria-label="Cuenta de jugador">
      <section className="w-full max-w-sm max-h-[90dvh] overflow-y-auto rounded-lg border border-border bg-card p-5 text-card-foreground shadow-lg">
        <div className="mb-5 flex items-center justify-between"><h2 className="flex items-center gap-2 font-semibold"><Shield size={18} />{account?.isAdmin ? "Administración" : "Cuenta de jugador"}</h2><Button variant="ghost" size="icon" aria-label="Cerrar cuenta" onClick={() => setOpen(false)}><X /></Button></div>
        {!account ? <div className="grid gap-3">
          <Button disabled={busy} variant="outline" className="google-signin" onClick={() => void login("google")}>
            <svg aria-hidden="true" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
            Continuar con Google
          </Button>
          <Button disabled={busy} onClick={() => void login("lovable")}>Continuar con Lovable</Button>
        </div> : <div className="grid gap-5">
          <form className="grid gap-3" onSubmit={async e => {
            e.preventDefault(); setBusy(true); setError(""); setNotice("");
            try { const profile = await saveProfile({ data: { display_name: name, avatar_url: avatar } }); const next = { ...account, profile }; setAccount(next); onChange(next); setNotice("Perfil guardado"); }
            catch { setError("No se pudo guardar el perfil. Revisa el nombre y la dirección de la imagen."); }
            finally { setBusy(false); }
          }}>
            {account.profile?.avatar_url && <img src={account.profile.avatar_url} alt="Avatar" className="h-14 w-14 rounded-md object-cover" referrerPolicy="no-referrer" />}
            <label className="grid gap-1 text-sm">Nombre<input className="rounded-md border border-input bg-background px-3 py-2 text-foreground" required maxLength={24} value={name} onChange={e => setName(e.target.value)} /></label>
            <label className="grid gap-1 text-sm">Avatar (URL HTTPS)<input className="rounded-md border border-input bg-background px-3 py-2 text-foreground" type="url" value={avatar} onChange={e => setAvatar(e.target.value)} /></label>
            <Button disabled={busy} type="submit"><Save />Guardar perfil</Button>
          </form>
          {account.isAdmin && <div className="grid gap-3 border-t border-border pt-4">
            <form className="flex gap-2" onSubmit={e => { e.preventDefault(); void updatePowers({ ...account.powers, tag }); }}>
              <label className="min-w-0 flex-1 text-sm">Tag<input aria-label="Tag" maxLength={24} value={tag} onChange={e => setTag(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-foreground" /></label>
              <Button className="self-end" size="icon" disabled={busy} type="submit" title="Guardar tag" aria-label="Guardar tag"><Save /></Button>
            </form>
            {abilities.map(({ key, label, icon: Icon }) => <label key={key} className="flex items-center gap-3 py-1 text-sm"><Icon size={18} /><span className="flex-1">{label}</span><input type="checkbox" checked={account.powers[key]} disabled={busy} onChange={e => void updatePowers({ ...account.powers, [key]: e.target.checked })} /></label>)}
            <Button variant="outline" disabled={busy} onClick={() => { setTag(""); void updatePowers(defaultPowers); }}>Restablecer poderes</Button>
          </div>}
          <Button variant="ghost" disabled={busy} onClick={async () => { await supabase.auth.signOut(); setAccount(null); onChange(null); }}><LogOut />Cerrar sesión</Button>
        </div>}
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        {notice && <p role="status" className="mt-3 text-sm">{notice}</p>}
      </section>
    </div>}
  </>;
}