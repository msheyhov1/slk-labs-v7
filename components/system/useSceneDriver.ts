"use client";

import { useEffect } from "react";
import { setActiveScene } from "@/lib/scene-store";
import type { SceneId } from "@/lib/scenes";

/**
 * Драйвер сцен: на скролле выбирает секцию [data-scene], чей центр ближе к
 * центру вьюпорта, и пишет её в стор (scene-store). Так и живая система, и
 * хедер узнают, «где сейчас» страница — из одного источника.
 *
 * Лёгкий: один passive scroll-листенер, троттлинг через rAF, без React-стейта.
 */
export function useSceneDriver() {
  useEffect(() => {
    let raf = 0;

    const pick = () => {
      raf = 0;
      const mid = window.innerHeight / 2;
      const nodes = document.querySelectorAll<HTMLElement>("[data-scene]");
      let bestId: SceneId | null = null;
      let bestDist = Infinity;
      for (const el of nodes) {
        const r = el.getBoundingClientRect();
        const center = r.top + r.height / 2;
        const dist = Math.abs(center - mid);
        if (dist < bestDist) {
          bestDist = dist;
          bestId = el.dataset.scene as SceneId;
        }
      }
      if (bestId) setActiveScene(bestId);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(pick);
    };

    pick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
}
