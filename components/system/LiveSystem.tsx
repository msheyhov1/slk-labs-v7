"use client";

import dynamic from "next/dynamic";
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
 */
export default function LiveSystem() {
  useSceneDriver();
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <SystemField />
    </div>
  );
}
