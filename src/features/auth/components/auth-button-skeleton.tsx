export function AuthButtonSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-muted h-9 w-14 animate-pulse rounded-md sm:h-8 sm:w-16" />
      <div className="bg-muted h-9 w-14 animate-pulse rounded-md sm:h-8 sm:w-16" />
    </div>
  );
}
