interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function Skeleton({ className = '', ...props }: SkeletonProps) {
  const baseClasses = 'bg-slate-light/20 animate-pulse rounded'
  const combinedClasses = className ? `${baseClasses} ${className}` : baseClasses

  return (
    <div
      className={combinedClasses}
      {...props}
    />
  )
}
