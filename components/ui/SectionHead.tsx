import type { ReactNode } from "react";
import { Reveal } from "@/components/Reveal";

/** Шапка секции: моно-индекс + заголовок + подзаголовок + правый слот (мета). */
export function SectionHead({
  index,
  title,
  lead,
  children,
  tone = "light",
  titleId,
}: {
  index: string;
  title: ReactNode;
  lead?: string;
  children?: ReactNode;
  tone?: "light" | "dark";
  titleId?: string;
}) {
  const dark = tone === "dark";
  return (
    <Reveal
      className={`flex flex-wrap items-end justify-between gap-6 border-b pb-8 ${
        dark ? "border-[var(--color-hairline-on-ink)]" : "border-hairline"
      }`}
    >
      <div>
        <span
          className={`font-mono text-[13px] uppercase tracking-label ${
            dark ? "text-signal" : "text-signal-ink"
          }`}
        >
          {index}
        </span>
        <h2
          id={titleId}
          className={`mt-[18px] text-h2 font-semibold leading-[1.08] tracking-tight ${
            dark ? "text-[var(--color-ink-fg)]" : "text-ink"
          }`}
        >
          {title}
        </h2>
        {lead ? (
          <p
            className={`mt-4 max-w-[44ch] text-body leading-body ${
              dark ? "text-[var(--color-ink-fg-3)]" : "text-ink-2"
            }`}
          >
            {lead}
          </p>
        ) : null}
      </div>
      {children}
    </Reveal>
  );
}
