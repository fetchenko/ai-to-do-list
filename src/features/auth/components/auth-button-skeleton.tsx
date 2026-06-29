export function AuthButtonSkeleton() {
  return (
    <div className="flex gap-2">
      <div className="bg-muted h-8 w-16 animate-pulse rounded-md" />
      <div className="bg-muted h-8 w-16 animate-pulse rounded-md" />
    </div>
  );
}
