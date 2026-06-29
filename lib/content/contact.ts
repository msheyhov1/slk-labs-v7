import { contacts } from "@/lib/site";

export const contact = {
  index: "04 — Контакт",
  titleLines: ["Хочу", "такой же"],
  lead: "Расскажите задачу — соберём систему под неё.",
  // каналы связи (как в v5): моно-лейбл + значение + стрелка ↗
  links: [
    { label: "Telegram", value: "@slklabs", href: contacts.telegram.href },
    { label: "Почта", value: contacts.email, href: `mailto:${contacts.email}` },
  ],
  note: "SLK-labs — студия разработки и автоматизации.",
  year: "2026",
} as const;
