# ARCHITECTURE — SLK-labs

Подробная карта реализации. Высокоуровневая версия и таблица «где что крутить» — в `CLAUDE.md`.

## Слои

```
данные/конфиг        →  представление            →  оркестрация
lib/site.ts             components/ui/*              app/page.tsx
lib/content/*           components/sections/*        app/layout.tsx
lib/cases.ts            components/hero/*            app/globals.css
lib/scenes.ts           components/{Header,Reveal,KineticText}
lib/scene-store.ts      components/system/*          (живая система за всем сайтом)
styles/tokens.css       components/system/network/*
lib/{gsap,motion}.ts
```

Зависимости направлены **вниз→вверх** только в одну сторону: компоненты импортируют данные,
данные не знают о компонентах. Циклов нет.

## Дизайн-токены → Tailwind

`styles/tokens.css` объявляет `@theme { … }` (Tailwind v4 CSS-first). Из этого Tailwind:
- генерит утилиты: `--color-bone` → `bg-bone`/`text-bone`; `--text-h2` → `text-h2`; `--ease-out-expo` → `ease-out-expo`; `--tracking-label` → `tracking-label` и т.д.;
- кладёт те же значения в `:root` как CSS-vars → доступны через `var(--color-…)` и произвольные классы `text-[var(--color-ink-fg)]`.

Производные (rgba на тёмном, контейнер, gutter, длительности) — обычный `:root`-блок ниже `@theme`.
`lib/motion.ts` зеркалит easing/длительности для GSAP; `lib/gsap.ts` регистрирует `CustomEase("settle", …)`
= тому же кубику, что и `--ease-out-expo`. Так CSS и GSAP двигаются одинаково.

## Моушн-конвейер

- **Плавный скролл:** `SmoothScroll` создаёт Lenis, гонит его через `gsap.ticker`, синкает
  `lenis.on("scroll", ScrollTrigger.update)`. При `prefers-reduced-motion` Lenis не стартует.
  Инерция регулируется `lerp` (сейчас 0.14 — отзывчиво, не «плавуче»).
- **Ревилы:** `globals.css` прячет `html.js [data-reveal]{opacity:0}` (без JS контент виден — прогресс-энхансмент).
  `Reveal` проигрывает `fromTo(y:22→0, autoAlpha:0→1, ease:settle)` по ScrollTrigger, с `stagger` для гридов.
- **Кинетический текст:** `KineticText` через SplitType бьёт на слова и оседает их по скроллу. Только манифест.

## Живая система (хребет) — components/system/ (v7, идея A)

Сеть из «эффекта в герое» стала **нервной системой всей страницы**: один фиксированный canvas за
всем контентом, который **рекоммутируется по скроллу**.

Конвейер: **scenes.ts (что под каждую секцию) → simulation.ts (физика+формации) → SystemField.tsx (рендер)**,
а активную сцену выбирает **useSceneDriver → scene-store**.

- `lib/scenes.ts` — ДАННЫЕ сцен: на каждую секцию `surface` (для хедера) · `formation`
  (cloud/clusters/columns/lattice/funnel) · `density` (доля видимых узлов) · `breath` · `linkDist` · `dim`
  (интенсивность сети, чтобы за костяными панелями не спорить с текстом) · `foci`.
- `lib/scene-store.ts` — единственный источник «где сейчас» страница. `setActiveScene(id)` зовёт драйвер;
  `getActiveScene()` читает `SystemField` в `useFrame` (без React-ререндеров); `subscribeScene` — для хедера.
- `components/system/useSceneDriver.ts` — на скролле/resize выбирает секцию `[data-scene]`, чей центр
  ближе к центру вьюпорта, и пишет её в стор (rAF-троттлинг, один passive-листенер).
- `components/system/network/config.ts` — БАЗОВЫЕ ручки (физика/радиусы/палитра/скорости рекоммутации).
- `components/system/network/simulation.ts` — чистый класс `NetworkSimulation` (без three/react). Владеет
  буферами `positions/heat/sizes/nodeAlpha/segPositions/segColors/segAlpha`. `setScene(scene)` пересчитывает
  **целевую формацию** (`restTarget`) и видимость (`visTarget`); `step(...)` лерпит дома/видимость/`dim`
  к целям и заполняет связи. Узлы мигрируют между формациями силой самой пружины.
- `components/system/SystemField.tsx` — r3f `<Canvas>`. Геометрии **ссылаются прямо на массивы симуляции**.
  В `useFrame`: если сменилась активная сцена → `sim.setScene` + импульс света; затем `sim.step` → `needsUpdate`.
- `components/system/LiveSystem.tsx` — фиксированный слой `pointer-events:none -z-10` за контентом; крутит
  драйвер (нужен и хедеру) и лениво (dynamic ssr:false) монтирует `SystemField`. Монтируется один раз в `layout`.

### Подложка + стеклянные приборы
Тело сайта — тёмное «живое поле» (`--color-substrate`), на нём canvas (alpha) рисует сеть. Секции —
полупрозрачные приборы поверх: тёмные сцены (герой/работы) прозрачны (сеть ярко видна), светлые
(услуги/манифест/контакт) — костяное стекло `.instrument` + `backdrop-blur` (сеть просвечивает faint,
текст читаем). Так сеть **видна по всему сайту**, но на контентных сценах уходит на второй план (`dim`).

### Палитра (контраст-закон)
Рендер на `NormalBlending` → корректен и на тёмном, и под стеклом. Сеть на тёмной подложке ВСЕГДА светлая
(костяная) с зелёным как свет/вспышка. Линии — собственный шейдер с **пер-сегментной альфой**, узлы — атрибут
видимости `aAlpha`. Спокойствие контентных сцен задаётся `dim` (гасит связи и тихий зелёный), а не сменой палитры.

### Физическая модель (почему так)
Каждый узел: пружина к «дому» (`rest`) + затухание (`friction`) → всегда **оседает в покой**. Дом
**мигрирует** к `restTarget` сцены — так узлы перестраиваются в формацию плавно. Дыхание сдвигает цель
синусом (амплитуда `breath` сцены). Курсор тянет по **sin-профилю** (гаснет у курсора и на краю → не
слипаются), вплотную — «чистая зона». Клик/смена сцены пускают **волну света** (кольцо поднимает жар
узлов и зажигает связи на фронте; силы не применяет).

### Почему pointer-events:none + window
Канвас `pointer-events:none` (скролл/клики по CTA свободны) → r3f-события до него не доходят; координаты
курсора берём из `window` `pointermove/pointerdown` и переводим в мировые через `getBoundingClientRect`.
На тач (нет `hover: hover`) тяга/лучи выключены, но тап пускает волну.

### reduced-motion
`simulation.step(..., reduced=true)` не двигает узлы, снапит цели, считает структуру один раз; `SystemField`
ставит `frameloop="demand"` и рендерит единственный кадр. Получается статичная структура.

## Адаптивный хедер
`Header` (клиент) через `useSyncExternalStore` берёт `surface` активной сцены из `scene-store` (тот же
источник, что и сеть): тёмная сцена → прозрачный фон + светлый текст; светлая → костяной blur-фон + тёмный.
Так нет чужеродной светлой плашки на тёмных сценах, и переключение точное по секции, а не по порогу скролла.

## Фазы
Готово 0–3. Дальше: фаза 4 — `app/api/assistant/route.ts` + `@anthropic-ai/sdk` (серверный ключ);
фаза 5 — реальные кейсы, `work/[slug]`, деплой на Vercel (выполняет владелец).
