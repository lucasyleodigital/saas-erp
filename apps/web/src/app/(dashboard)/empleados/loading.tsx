export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-44 bg-muted rounded-lg" />
        <div className="h-9 w-40 bg-muted rounded-lg" />
      </div>
      <div className="h-10 bg-muted rounded-lg" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-14 bg-muted rounded-lg" />
      ))}
    </div>
  );
}
