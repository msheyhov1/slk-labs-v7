"use client";

import { useSyncExternalStore } from "react";
import { Container } from "@/components/ui/Container";
import { nav } from "@/lib/site";
import { getActiveScene, subscribeScene } from "@/lib/scene-store";

export function Header() {
  // Хедер берёт поверхность активной сцены из стора (тот же источник, что и сеть):
  // тёмная сцена → прозрачный + светлый текст; светлая → костяное стекло + тёмный.
  const surface = useSyncExternalStore(
    subscribeScene,
    () => getActiveScene().surface,
    () => "dark" as const,
  );
  const dark = surface === "dark";

  const shell = dark
    ? "border-transparent bg-transparent"
    : "border-hairline bg-[var(--color-bone-glass)] backdrop-blur-[14px]";
  const logo = dark ? "text-[var(--color-ink-fg)]" : "text-ink";
  const suffix = dark ? "text-[var(--color-ink-fg-3)]" : "text-ink-2";
  const dot = dark ? "bg-signal" : "bg-signal-ink";
  const link = dark
    ? "text-[var(--color-ink-fg-3)] hover:text-[var(--color-ink-fg)]"
    : "text-ink-2 hover:text-ink";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 flex h-[var(--header-h)] items-center border-b transition-colors duration-300 ease-standard ${shell}`}
    >
      <Container className="flex items-center justify-between gap-6">
        <a
          href="#top"
          aria-label="SLK-labs — на главную"
          className={`flex items-center gap-[10px] no-underline ${logo}`}
        >
          <span aria-hidden className={`slk-pulse h-2 w-2 shrink-0 rounded-[1px] ${dot}`} />
          <span className="text-[17px] font-semibold tracking-tight">
            SLK<span className={suffix}>-labs</span>
          </span>
        </a>

        <nav aria-label="Основная навигация" className="flex items-center gap-5 sm:gap-7">
          {nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className={`-my-3 py-3 font-mono text-[12px] uppercase tracking-label no-underline transition-colors duration-[var(--dur-micro)] ease-standard sm:text-[13px] ${link}`}
            >
              {n.label}
            </a>
          ))}
        </nav>
      </Container>
    </header>
  );
}
