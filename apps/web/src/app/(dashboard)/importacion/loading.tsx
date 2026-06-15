export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 bg-muted rounded-lg" />
        ))}
      </div>
      <div className="h-48 bg-muted rounded-lg" />
    </div>
  );
}
