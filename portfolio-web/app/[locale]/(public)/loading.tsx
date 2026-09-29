// Shown while the next page loads, so a click never feels dead. The fade-in
// delay keeps fast navigations from flashing it at all.
export default function Loading() {
  return (
    <div
      className="wrap animate-fade-up py-14 sm:py-24"
      style={{ animationDelay: "150ms" }}
      aria-busy="true"
    >
      <span className="sr-only">Loading…</span>
      <div className="animate-pulse">
        <div className="h-3 w-40 rounded bg-raised" />
        <div className="mt-6 h-10 w-3/4 max-w-2xl rounded bg-raised sm:h-14" />
        <div className="mt-8 max-w-xl space-y-3">
          <div className="h-4 w-full rounded bg-surface" />
          <div className="h-4 w-11/12 rounded bg-surface" />
          <div className="h-4 w-2/3 rounded bg-surface" />
        </div>
      </div>
    </div>
  );
}
