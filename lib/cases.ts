// Данные кейсов (плейсхолдеры из CLAUDE.md §Кейсы).
// ⚠️ Перед публичной витриной — подтвердить, что проекты можно показывать
// (крипто/AML и клиентские сайты могут требовать обезличивания/NDA).
// При росте — переезд в MDX.

export type Case = {
  slug: string;
  idx: string;
  title: string;
  sub: string;
  type: string;
  year: string;
  stack: string;
  summary: string;
};

export const cases: Case[] = [
  {
    slug: "new-link-food",
    idx: "K-01",
    title: "New Link Food",
    sub: "",
    type: "Сайт",
    year: "2025",
    stack: "web · 3d · i18n",
    summary: "Билингвальный продуктовый сайт с интерактивным 3D-глобусом и RFQ.",
  },
  {
    slug: "smena",
    idx: "K-02",
    title: "Смена",
    sub: "",
    type: "Telegram Mini App",
    year: "2025",
    stack: "telegram · fastapi · postgres",
    summary: "Сменное планирование как Telegram Mini App.",
  },
  {
    slug: "dozor",
    idx: "K-03",
    title: "Дозор",
    sub: "",
    type: "Мониторинг",
    year: "2025",
    stack: "trc20 · aml",
    summary: "AML-мониторинг TRC20 и OTC-курсов в реальном времени.",
  },
];
