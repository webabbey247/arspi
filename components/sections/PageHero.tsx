import { cn } from "@/lib/utils";

interface PageHeroProps {
  eyebrow: string;
  title: React.ReactNode;
  lead?: string;
  children?: React.ReactNode;
  className?: string;
  right?: React.ReactNode;
}

export function PageHero({ eyebrow, title, lead, children, className, right }: PageHeroProps) {
  return (
    <section
      className={cn(
        "bg-ink-deep relative overflow-hidden",
        right ? "grid lg:grid-cols-2 gap-16 items-center px-8 md:px-16 py-24 lg:py-28" : "px-8 md:px-16 py-24 lg:py-28",
        className
      )}
    >
      {/* Grid decoration */}
      <div className="absolute inset-0 bg-grid-ink bg-[length:60px_60px] pointer-events-none" />
      {/* Glow */}
      <div className="absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full bg-sapphire/8 blur-[100px] pointer-events-none" />

      <div className="relative z-10">
        <p className="eyebrow flex items-center gap-3 mb-6">
          <span className="block w-8 h-px bg-sapphire" />
          {eyebrow}
        </p>
        <h1 className="font-serif text-sky-light font-normal leading-[1.12] tracking-tight text-4xl md:text-5xl lg:text-[3.4rem] mb-5">
          {title}
        </h1>
        {lead && (
          <p className="text-white/50 font-light leading-loose text-base max-w-xl mb-8">{lead}</p>
        )}
        {children}
      </div>

      {right && (
        <div className="relative z-10 hidden lg:block">{right}</div>
      )}
    </section>
  );
}

// Stat strip used across hero sections
interface StatItem { value: string; label: string }
export function HeroStats({ stats }: { stats: StatItem[] }) {
  return (
    <div className="flex gap-8 flex-wrap pt-8 mt-8 border-t border-sapphire/15">
      {stats.map((s) => (
        <div key={s.label}>
          <span className="block font-serif text-[1.7rem] text-sky font-normal leading-none mb-1">
            {s.value}
          </span>
          <span className="text-[0.68rem] text-white/35 uppercase tracking-[0.1em]">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
