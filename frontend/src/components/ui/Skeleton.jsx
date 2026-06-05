import { cn } from '../../utils/helpers';

export const Skeleton = ({ className }) => (
  <div className={cn('skeleton', className)} />
);

export const SkeletonCard = ({ lines = 3 }) => (
  <div className="card p-5 space-y-3">
    <Skeleton className="h-6 w-1/2" />
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className="h-4 w-full" />
    ))}
  </div>
);

export default Skeleton;
