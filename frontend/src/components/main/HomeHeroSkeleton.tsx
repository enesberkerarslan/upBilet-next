export function HomeHeroSkeleton() {
  return (
    <div
      className="relative flex h-[450px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl bg-zinc-200/90 text-zinc-600 md:h-[500px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="absolute inset-0 animate-pulse  from-zinc-200 via-zinc-100 to-zinc-200" />
      <div className="relative flex flex-col items-center gap-4 px-6 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#615FFF] border-t-transparent" />

      </div>
    </div>
  );
}
