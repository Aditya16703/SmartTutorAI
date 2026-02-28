export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-4xl mx-auto pt-24 pb-8 px-4">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-9 w-56 bg-muted/60 rounded-lg animate-pulse mb-2" />
          <div className="h-5 w-80 bg-muted/40 rounded-md animate-pulse" />
        </div>

        {/* Profile summary skeleton */}
        <div className="rounded-xl border border-border/50 bg-card/50 p-6 mb-6 animate-pulse">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-muted/60" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-48 bg-muted/50 rounded-md" />
              <div className="h-4 w-64 bg-muted/30 rounded-md" />
            </div>
          </div>
        </div>

        {/* Form skeleton */}
        <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-6 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-muted/40 rounded" />
              <div className="h-10 w-full bg-muted/30 rounded-md" />
            </div>
          ))}
          <div className="h-10 w-32 bg-muted/50 rounded-md" />
        </div>
      </div>
    </div>
  );
}
