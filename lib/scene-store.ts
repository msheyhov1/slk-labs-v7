// Активная сцена — единственный источник правды о том, «где сейчас» страница.
//
// Драйвер (useSceneDriver) при скролле зовёт setActiveScene(id).
// • SystemField читает getActiveScene() прямо в useFrame (без React-ререндеров).
// • Header подписывается через useSyncExternalStore (нужен только surface: dark/light).
//
// Так и тяжёлый рендер-цикл, и UI берут одно состояние из одного места.
import { DEFAULT_SCENE, SCENES, type Scene, type SceneId } from "./scenes";

let active: Scene = DEFAULT_SCENE;
const listeners = new Set<() => void>();

export function setActiveScene(id: SceneId) {
  if (active.id === id) return;
  active = SCENES[id];
  for (const l of listeners) l();
}

/** Прямое чтение (для useFrame — без подписки). */
export function getActiveScene(): Scene {
  return active;
}

/** Подписка для React (useSyncExternalStore). */
export function subscribeScene(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
