export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded-lg" />
      <div className="h-10 w-64 bg-muted rounded-lg" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-16 bg-muted rounded-lg" />
      ))}
    </div>
  );
}
