export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* Back button skeleton */}
        <div className="mb-8">
          <div className="h-9 w-48 bg-muted/40 rounded-md animate-pulse mb-4" />

          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-muted/50 rounded-lg animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-8 w-64 bg-muted/60 rounded-lg animate-pulse" />
              <div className="h-4 w-40 bg-muted/30 rounded-md animate-pulse" />
            </div>
          </div>
        </div>

        {/* Content tabs skeleton */}
        <div className="flex gap-2 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-10 w-28 bg-muted/40 rounded-md animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>

        {/* Content area skeleton */}
        <div className="rounded-xl border border-border/50 bg-card/50 p-8 space-y-4 animate-pulse">
          <div className="h-6 w-48 bg-muted/50 rounded-md" />
          <div className="h-4 w-full bg-muted/30 rounded-md" />
          <div className="h-4 w-full bg-muted/30 rounded-md" />
          <div className="h-4 w-3/4 bg-muted/30 rounded-md" />
          <div className="h-4 w-5/6 bg-muted/30 rounded-md" />
          <div className="h-4 w-2/3 bg-muted/30 rounded-md" />
        </div>
      </div>
    </div>
  );
}
