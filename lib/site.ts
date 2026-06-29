// Единая конфигурация сайта: идентичность, навигация, контакты, SEO.
export const site = {
  name: "SLK-labs",
  url: "https://slk-labs.dev",
  title: "SLK-labs — Процессы, которые живут без вас.",
  description: "Сайты. Боты. Автоматизация. Процессы, которые живут без вас.",
  payoff: "Студия разработки и автоматизации: сайты. боты. автоматизация.",
  locale: "ru_RU",
  themeColor: "#F2F0E9",
  keywords: ["разработка сайтов", "Telegram-боты", "автоматизация", "Next.js", "WebGL"],
} as const;

export const nav = [
  { href: "#works", label: "Работы" },
  { href: "#services", label: "Услуги" },
  { href: "#contact", label: "Контакт" },
] as const;

export const contacts = {
  email: "hello@slk-labs.studio",
  telegram: { label: "Telegram @slklabs", href: "https://t.me/slklabs" },
  location: "Remote · СНГ / EU",
} as const;
