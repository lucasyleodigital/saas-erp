export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 bg-muted rounded-lg" />
        <div className="h-9 w-44 bg-muted rounded-lg" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded-lg" />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-14 bg-muted rounded-lg" />
      ))}
    </div>
  );
}
