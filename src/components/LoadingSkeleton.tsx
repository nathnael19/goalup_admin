import React from "react";

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-slate-800/50 rounded-lg ${className}`}
        />
      ))}
    </>
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="card p-6 space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="w-12 h-12 rounded-2xl" />
      <Skeleton className="w-12 h-5 rounded-md" />
    </div>
    <Skeleton className="w-24 h-4" />
    <Skeleton className="w-16 h-8" />
  </div>
);
