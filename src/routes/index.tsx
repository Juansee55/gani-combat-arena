import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { loadSave, saveProgress } from "@/lib/saves.functions";
import cityAsset from "@/assets/era-city.png.asset.json";
import { GameAccountPanel, type GameAccount } from "@/components/game-account";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gani Combat Arena — Ciudad Era" },
      { name: "description", content: "Recorre Ciudad Era, sus calles e islas, con ataques Gani, perfil y partida guardada." },
      { property: "og:title", content: "Gani Combat Arena — Ciudad Era" },
      { property: "og:description", content: "Ciudad pixel art con ataques Gani y poderes de administrador protegidos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Game,
});

function getToken() {
  let t = localStorage.getItem("santatown_token");
  if (!t) {
    t = crypto.randomUUID() + crypto.randomUUID();
    localStorage.setItem("santatown_token", t);
  }
  return t;
}

function Game() {
  const frame = useRef<HTMLIFrameElement>(null);
  const account = useRef<GameAccount | null>(null);
  const load = useServerFn(loadSave);
  const saveFn = useServerFn(saveProgress);
  const onAccount = useCallback((next: GameAccount | null) => {
    account.current = next;
    frame.current?.contentWindow?.postMessage({ type: "city:powers", isAdmin: next?.isAdmin ?? false, powers: next?.powers }, window.location.origin);
    if (next?.profile) frame.current?.contentWindow?.postMessage({ type: "city:profile", name: next.profile.display_name }, window.location.origin);
  }, []);
  const configure = useCallback(() => {
    frame.current?.contentWindow?.postMessage({ type: "city:config", url: cityAsset.url }, window.location.origin);
    onAccount(account.current);
  }, [onAccount]);

  useEffect(() => {
    const token = getToken();
    const onMsg = async (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const m = e.data as { type?: string; save?: Record<string, unknown> };
      try {
        if (m.type === "santatown:ready") {
          configure();
          const save = await load({ data: { token } });
          if (save) frame.current?.contentWindow?.postMessage({ type: "santatown:load", save }, window.location.origin);
          onAccount(account.current);
        } else if (m.type === "santatown:save" && m.save) {
          await saveFn({ data: { token, ...(m.save as { map: "santatown" | "era-city-v1"; name: string; x: number; y: number; dir: "up" | "down" | "left" | "right"; attacks: number }) } });
        }
      } catch (err) {
        console.error("No se pudo guardar/cargar la partida", err);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [load, saveFn, configure, onAccount]);

  return (
    <main className="fixed inset-0 bg-background">
      <iframe ref={frame} onLoad={configure} src="/game/santatown.html" title="Ciudad Era" className="h-full w-full border-0" />
      <GameAccountPanel onChange={onAccount} />
    </main>
  );
}
