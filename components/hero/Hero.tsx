import { Container } from "@/components/ui/Container";
import { MonoLabel } from "@/components/ui/MonoLabel";
import { hero } from "@/lib/content/hero";

export function Hero() {
  return (
    <section
      id="top"
      data-scene="hero"
      className="relative flex min-h-[100svh] items-center overflow-hidden text-[var(--color-ink-fg)]"
    >
      {/* фон секции — прозрачный: за ним живая система на тёмной подложке. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 70% 30%, rgb(var(--color-signal-rgb) / 0.06), transparent 60%)",
        }}
      />

      <Container className="relative z-[2] py-[120px] pt-[136px]">
        <div className="mb-12 flex items-center justify-between gap-6 border-b border-[var(--color-hairline-on-ink)] pb-7">
          <MonoLabel tone="fg-3">{hero.eyebrow}</MonoLabel>
          <span className="flex items-center gap-2 whitespace-nowrap font-mono text-[13px] tracking-[0.06em] text-signal">
            <span className="signal-glow h-[6px] w-[6px] rounded-full bg-signal" />
            {hero.status}
          </span>
        </div>

        {/* Вордмарк — гигантское «SLK-labs» (как на фото): SLK гротеск, -labs моно зелёный */}
        <h1 className="m-0 flex items-end leading-[0.86] tracking-display">
          <span className="font-semibold text-[clamp(3.5rem,13vw,11rem)]">SLK</span>
          <span className="ml-[0.04em] pb-[0.12em] font-mono text-signal text-[clamp(1.1rem,3.6vw,3rem)] tracking-tight">
            -labs
          </span>
        </h1>

        <p className="mt-10 max-w-[40rem] text-[clamp(1.3rem,2.4vw,2.1rem)] font-medium leading-tight tracking-tight text-[var(--color-ink-fg-2)]">
          {hero.payoff}
        </p>

        <dl className="mt-16 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-px border border-[var(--color-hairline-on-ink-soft)] bg-[var(--color-hairline-on-ink-soft)]">
          {hero.specs.map((s) => (
            <div key={s.label} className="m-0 bg-ink px-[18px] py-4">
              <dt className="font-mono text-[11px] uppercase tracking-label text-ink-2">{s.label}</dt>
              <dd
                className={`m-0 mt-[6px] font-mono text-[14px] ${
                  "signal" in s && s.signal ? "text-signal" : "text-[var(--color-ink-fg)]"
                }`}
              >
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </Container>

      <span className="absolute bottom-7 left-[var(--gutter)] z-[2] font-mono text-[12px] uppercase tracking-label text-[var(--color-ink-fg-3)]">
        {hero.scrollCue}
      </span>
    </section>
  );
}
