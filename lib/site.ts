// Единая конфигурация сайта: идентичность, навигация, контакты, SEO.
export const site = {
  name: "SLK-labs",
  // Фактический прод сейчас — GitHub Pages (project-path). При переезде на свой
  // домен поменять ЭТУ строку (og:image/canonical/sitemap/robots подтянутся).
  url: "https://msheyhov1.github.io/slk-labs-v7",
  title: "SLK-labs — Процессы, которые живут без вас.",
  description: "Сайты. Боты. Автоматизация. Процессы, которые живут без вас.",
  payoff: "Студия разработки и автоматизации: сайты. боты. автоматизация.",
  locale: "ru_RU",
  themeColor: "#0E1114",
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
