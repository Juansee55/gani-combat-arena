import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { loadSave, saveProgress } from "@/lib/saves.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Santa Town — Graal Era" },
      { name: "description", content: "Explora Santa Town con nuevos ataques: Corte Cruzado y Lanza Relámpago. Tu progreso se guarda." },
      { property: "og:title", content: "Santa Town — Graal Era" },
      { property: "og:description", content: "Juego navideño pixel art con nuevos movimientos de armas y guardado en la nube." },
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

  useEffect(() => {
    const token = getToken();
    const onMsg = async (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const m = e.data as { type?: string; save?: Record<string, unknown> };
      try {
        if (m.type === "santatown:ready") {
          const save = await loadSave({ data: { token } });
          if (save) frame.current?.contentWindow?.postMessage({ type: "santatown:load", save }, window.location.origin);
        } else if (m.type === "santatown:save" && m.save) {
          await saveProgress({ data: { token, ...(m.save as never) } });
        }
      } catch (err) {
        console.error("No se pudo guardar/cargar la partida", err);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  return (
    <main className="fixed inset-0 bg-background">
      <iframe ref={frame} src="/game/santatown.html" title="Santa Town" className="h-full w-full border-0" />
    </main>
  );
}
