export function AuthButtonSkeleton() {
  return (
    <div className="flex gap-2">
      <div className="h-8 w-16 bg-muted rounded-md animate-pulse" />
      <div className="h-8 w-16 bg-muted rounded-md animate-pulse" />
    </div>
  );
}