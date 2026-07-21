import type { PostType } from "@/lib/types";

const config: Record<PostType, { label: string; className: string }> = {
  weekly: { label: "weekly", className: "text-amber border-amber/40 bg-amber/10" },
  daily: { label: "daily", className: "text-moss border-moss/40 bg-moss/10" },
  "deep-dive": {
    label: "deep dive",
    className: "text-paper border-paper-faint/40 bg-paper/5",
  },
  til: {
    label: "til",
    className: "text-amber-soft border-amber-soft/30 bg-amber-soft/5",
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
