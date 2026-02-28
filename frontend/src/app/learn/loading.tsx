export default function Loading() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto pt-24 pb-12 px-4">
        {/* Header skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex-1">
            <div className="h-10 w-72 bg-muted/60 rounded-lg animate-pulse mb-2" />
            <div className="h-5 w-96 bg-muted/40 rounded-md animate-pulse" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-10 w-64 bg-muted/40 rounded-md animate-pulse" />
            <div className="h-10 w-40 bg-muted/50 rounded-md animate-pulse" />
          </div>
        </div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-4 animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="h-5 w-3/4 bg-muted/60 rounded-md" />
              <div className="h-4 w-full bg-muted/30 rounded-md" />
              <div className="h-4 w-1/2 bg-muted/30 rounded-md" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-3 w-24 bg-muted/20 rounded" />
                <div className="h-8 w-20 bg-muted/30 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
