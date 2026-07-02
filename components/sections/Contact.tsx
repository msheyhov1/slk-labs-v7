import { MonoLabel } from "@/components/ui/MonoLabel";
import { Reveal } from "@/components/Reveal";
import { contact } from "@/lib/content/contact";

export function Contact() {
  return (
    <footer
      id="contact"
      data-scene="contact"
      aria-labelledby="contact-title"
      className="instrument px-[var(--gutter)] py-[clamp(72px,10vw,128px)] pb-12"
    >
      <div className="mx-auto w-full max-w-[var(--container-max)]">
        <Reveal className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-end gap-[clamp(40px,6vw,96px)] border-b border-hairline pb-16">
          <div>
            <MonoLabel tone="signal-ink">{contact.index}</MonoLabel>
            <h2
              id="contact-title"
              className="mt-[18px] text-[clamp(2.2rem,5vw,4.2rem)] font-semibold leading-[1.02] tracking-display text-ink"
            >
              {contact.titleLines[0]}
              <br />
              {contact.titleLines[1]}
            </h2>
            <p className="mt-6 max-w-[34ch] text-lead leading-body text-ink-2">{contact.lead}</p>
          </div>

          {/* Каналы связи — стеклянные ссылки с ↗ (как в v5), стиль v1 на светлом */}
          <div className="flex flex-col gap-[14px]">
            {contact.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-4 rounded-sm border border-hairline tile-bone px-[22px] py-[18px] no-underline transition-colors duration-[var(--dur-micro)] ease-standard hover:border-[color:var(--color-signal-ink)]"
              >
                <span className="flex flex-col gap-[6px]">
                  <MonoLabel tone="ink-2">{l.label}</MonoLabel>
                  <span className="text-[1.1rem] font-medium tracking-tight text-ink">{l.value}</span>
                </span>
                <span aria-hidden className="text-[1.2rem] text-signal-ink transition-transform duration-[var(--dur-micro)] ease-standard group-hover:-translate-y-[2px] group-hover:translate-x-[2px]">
                  ↗
                </span>
              </a>
            ))}
          </div>
        </Reveal>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-7">
          <div className="flex items-center gap-[10px] font-mono text-[12px] tracking-[0.06em] text-ink-2">
            <span aria-hidden className="slk-pulse h-2 w-2 rounded-[1px] bg-signal-ink" />
            <span>{contact.note}</span>
          </div>
          <span className="font-mono text-[12px] tracking-[0.06em] text-ink-2">© {contact.year}</span>
        </div>
      </div>
    </footer>
  );
}
