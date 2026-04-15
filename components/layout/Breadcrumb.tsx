import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  sticky?: boolean;
  className?: string;
}

export function Breadcrumb({ items, sticky = false, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "px-8 md:px-16 py-3.5 bg-sky-light/97 backdrop-blur border-b border-sapphire/25 flex items-center gap-2 text-[0.75rem] text-slate-400 flex-wrap",
        sticky && "sticky top-17 z-40",
        className
      )}
    >
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center gap-2">
          {idx > 0 && <ChevronRight className="h-3 w-3 text-sapphire/40" />}
          {item.href ? (
            <Link href={item.href} className="text-sapphire hover:text-ink transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-400">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
