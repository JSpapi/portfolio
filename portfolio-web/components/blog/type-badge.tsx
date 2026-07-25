import type { PostType } from "@/lib/types";

const config: Record<PostType, { label: string; className: string }> = {
  weekly: { label: "weekly", className: "text-accent border-accent/40 bg-accent/10" },
  daily: { label: "daily", className: "text-highlight border-highlight/40 bg-highlight/10" },
  "deep-dive": {
    label: "deep dive",
    className: "text-foreground border-foreground-faint/40 bg-foreground/5",
  },
  til: {
    label: "til",
    className: "text-accent-soft border-accent-soft/30 bg-accent-soft/5",
  },
};

export function TypeBadge({ type }: { type: PostType }) {
  const c = config[type] ?? config.weekly;
  return (
    <span
      className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${c.className}`}
    >
      {c.label}
    </span>
  );
}
