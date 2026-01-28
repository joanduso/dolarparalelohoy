type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = '' }: SkeletonProps) {
  return <span className={`inline-block animate-pulse rounded bg-ink/10 ${className}`} />;
}
