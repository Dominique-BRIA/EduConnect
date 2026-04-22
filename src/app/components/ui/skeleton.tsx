import * as React from "react"
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
      {...props}
    />
  )
}

// Preset skeletons for common use cases
function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      <Skeleton className="h-48 w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

function SkeletonPublicationCard() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-8 w-1/4" />
      </div>
    </div>
  )
}

function SkeletonUserCard() {
  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-2 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-8 w-full" />
    </div>
  )
}

function SkeletonLiveCard() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-48 w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-2 w-1/4" />
        </div>
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonPublicationCard, SkeletonUserCard, SkeletonLiveCard }
