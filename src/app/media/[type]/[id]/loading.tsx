import { AppNav } from "@/components/app-nav";
import { Skeleton } from "@/components/ui/skeleton";

export default function MediaDetailsLoading() {
  return (
    <main className="min-h-screen bg-ink pb-24 lg:pb-0">
      <AppNav />

      <section className="relative min-h-[680px] overflow-hidden bg-panel">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] via-ink/80 to-ink" />
        <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-end gap-8 px-4 pb-12 pt-24 sm:px-6 md:grid-cols-[240px_minmax(0,1fr)] md:items-center md:pb-16 lg:px-8">
          <Skeleton className="mx-auto aspect-[2/3] w-48 rounded-lg md:mx-0 md:w-full" />
          <div className="space-y-6">
            <div className="flex flex-wrap justify-center gap-2 md:justify-start">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-28 rounded-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="mx-auto h-16 w-11/12 max-w-2xl md:mx-0" />
              <Skeleton className="mx-auto h-10 w-72 rounded-full md:mx-0" />
              <Skeleton className="mx-auto h-24 w-full max-w-2xl md:mx-0" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="aspect-video rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-44" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="w-[138px] shrink-0 space-y-3">
                <Skeleton className="aspect-[3/4] rounded-lg" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
