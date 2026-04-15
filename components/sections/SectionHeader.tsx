import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: string;
  center?: boolean;
  dark?: boolean;
  className?: string;
  action?: React.ReactNode;
}

export function SectionHeader({
  eyebrow,
  title,
  lead,
  center,
  dark,
  className,
  action,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-10 lg:mb-14",
        center && "text-center",
        action && "flex items-end justify-between gap-6 flex-wrap",
        className
      )}
    >
      <div className={center ? "mx-auto" : undefined}>
        {eyebrow && (
          <p
            className={cn(
              "eyebrow mb-3",
              dark ? "text-sapphire" : "text-sapphire"
            )}
          >
            {eyebrow}
          </p>
        )}
        <h2
          className={cn(
            "font-serif text-3xl md:text-4xl font-normal leading-tight",
            dark ? "text-sky-light" : "text-ink"
          )}
        >
          {title}
        </h2>
        {lead && (
          <p
            className={cn(
              "mt-3 font-light leading-loose text-base max-w-2xl",
              dark ? "text-white/45" : "text-slate-600",
              center && "mx-auto"
            )}
          >
            {lead}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
