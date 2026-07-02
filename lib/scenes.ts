// СЦЕНЫ — мозг рекоммутации живой системы (v7, идея A).
//
// Сайт = одна непрерывная нервная сеть (фиксированный canvas за всем контентом).
// При скролле сеть НЕ просто дышит — она РЕКОММУТИРУЕТСЯ под каждую секцию:
// меняет формацию узлов, плотность, палитру и характер движения. Контент живёт
// в стеклянных «окнах-приборах» поверх живой подложки.
//
// Это ДАННЫЕ, не логика: simulation.ts читает targets и плавно лерпит к ним.
// Контраст-закон соблюдён через `surface`: на тёмной подложке узлы светлые +
// зелёный как свет; на светлой (стекло-секции) узлы графитовые, зелёный — только
// краткой вспышкой при взаимодействии.

export type SceneId = "hero" | "works" | "services" | "manifesto" | "contact";
export type Surface = "dark" | "light";
export type Formation = "cloud" | "clusters" | "columns" | "lattice" | "funnel";

export type Scene = {
  id: SceneId;
  /** Только для хедера: над тёмной сценой — прозрачный+светлый текст; над светлой
   *  (костяная панель) — стекло+тёмный. Сеть рисуется на тёмной подложке ВСЕГДА
   *  светлой/зелёной (видна), её спокойствие задаётся `dim`, а не палитрой. */
  surface: Surface;
  /** как узлы перестраиваются под секцию. */
  formation: Formation;
  /** доля видимых узлов (0..1) — остальные гаснут (alpha→0). */
  density: number;
  /** множитель амплитуды «дыхания» в покое. */
  breath: number;
  /** множитель макс. дистанции связи (гуще/реже паутина). */
  linkDist: number;
  /** интенсивность сети 0..1: гасит связи и тихий зелёный, чтобы за костяными
   *  панелями (контентные сцены) сеть не спорила с текстом. */
  dim: number;
  /** число фокусов для clusters/columns. */
  foci: number;
};

// Порядок = порядок секций на странице (page.tsx). Драйвер выбирает активную
// по близости центра секции к центру вьюпорта.
export const SCENES: Record<SceneId, Scene> = {
  // Герой — свободное органическое облако, всё видимо, живое дыхание, сеть ярче всего.
  hero: { id: "hero", surface: "dark", formation: "cloud", density: 1.0, breath: 1.0, linkDist: 1.0, dim: 1.0, foci: 0 },
  // Работы — узлы стягиваются в 3 созвездия (предвестник v9), сеть гуще внутри кластеров.
  works: { id: "works", surface: "dark", formation: "clusters", density: 0.9, breath: 0.7, linkDist: 0.92, dim: 0.92, foci: 3 },
  // Услуги — три вертикальные колонны-«опоры» (Сайты / Боты / Авто), сеть приглушена под текст.
  services: { id: "services", surface: "light", formation: "columns", density: 0.72, breath: 0.5, linkDist: 0.8, dim: 0.6, foci: 3 },
  // Манифест — разрежённая спокойная решётка, движение почти замирает.
  manifesto: { id: "manifesto", surface: "light", formation: "lattice", density: 0.42, breath: 0.32, linkDist: 1.12, dim: 0.46, foci: 0 },
  // Контакт — узлы сходятся к одному фокусу (точка «поговорить с нами»).
  contact: { id: "contact", surface: "light", formation: "funnel", density: 0.82, breath: 0.55, linkDist: 0.96, dim: 0.68, foci: 1 },
};

export const SCENE_ORDER: SceneId[] = ["hero", "works", "services", "manifesto", "contact"];

export const DEFAULT_SCENE: Scene = SCENES.hero;
