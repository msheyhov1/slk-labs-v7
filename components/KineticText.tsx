"use client";

import { createElement, useEffect, useRef, type ElementType } from "react";
import SplitType from "split-type";
import { gsap, prefersReduced } from "@/lib/gsap";
import { motion } from "@/lib/motion";

/**
 * Кинетический текст: слова ОСЕДАЮТ построчно по скроллу (грамматика «сборки»).
 * prefers-reduced-motion → обычный статичный текст.
 *
 * A11y: SplitType дробит текст на span-осколки, а GSAP держит их autoAlpha:0 до
 * скролла — скринридер видел бы рваный/скрытый текст. Поэтому видимый (осколочный)
 * слой скрыт от SR (aria-hidden), а рядом лежит sr-only копия целой фразы —
 * aria-label здесь не годится: на role=paragraph он запрещён ARIA-спекой.
 */
export function KineticText({
  as: Tag = "p",
  text,
  className = "",
  start = "top 82%",
}: {
  as?: ElementType;
  text: string;
  className?: string;
  start?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReduced()) return;

    let split: SplitType | null = null;
    let ctx: ReturnType<typeof gsap.context> | null = null;
    let cancelled = false;

    const run = () => {
      if (cancelled || !el) return;
      split = new SplitType(el, { types: "lines,words", tagName: "span" });
      ctx = gsap.context(() => {
        gsap.fromTo(
          split!.words,
          { autoAlpha: 0, yPercent: 60 },
          {
            autoAlpha: 1,
            yPercent: 0,
            duration: motion.dur.base,
            ease: motion.ease.settle,
            stagger: motion.stagger,
            scrollTrigger: { trigger: el, start, once: true },
          },
        );
      }, el);
    };

    // ждём шрифт — иначе строки разобьются неверно
    if (document.fonts?.ready) document.fonts.ready.then(run);
    else run();

    return () => {
      cancelled = true;
      ctx?.revert();
      split?.revert();
    };
  }, [text, start]);

  return createElement(
    Tag,
    { className },
    <span className="sr-only">{text}</span>,
    <span key="visual" ref={ref} aria-hidden className="block">
      {text}
    </span>,
  );
}
