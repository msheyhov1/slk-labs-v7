"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useSceneDriver } from "./useSceneDriver";

/** Тихая подложка, пока грузится WebGL: лёгкое зелёное свечение в углу. */
function SystemPlaceholder() {
  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(120% 90% at 72% 28%, rgb(var(--color-signal-rgb) / 0.05), transparent 60%)",
      }}
    />
  );
}

// Один WebGL-момент на весь сайт: грузим лениво, только на клиенте.
const SystemField = dynamic(() => import("./SystemField"), {
  ssr: false,
  loading: () => <SystemPlaceholder />,
});

/**
 * Живая система — нервная сеть всей страницы. Фиксированный слой ЗА контентом
 * (pointer-events:none — скролл и клики свободны; курсор сеть слушает на window).
 * Драйвер сцен крутится здесь (нужен и хедеру), даже пока канвас ещё грузится.
 *
 * Монтирование тяжёлого WebGL-чанка (three+r3f ≈ 236KB gzip) откладываем на
 * простой main-thread (requestIdleCallback, fallback setTimeout), чтобы его
 * парсинг/инициализация не конкурировали с гидрацией героя за первый INP/TBT.
 * Гейтим ТОЛЬКО канвас — драйвер сцен и подписанный хедер работают сразу.
 */
export default function LiveSystem() {
  useSceneDriver();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ric = window.requestIdleCallback;
    if (ric) {
      const id = ric(() => setReady(true), { timeout: 1200 });
      return () => window.cancelIdleCallback?.(id);
    }
    const t = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      {ready ? <SystemField /> : <SystemPlaceholder />}
    </div>
  );
}
