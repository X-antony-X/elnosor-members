import { CardSkeleton } from "@/components/ui/loading-skeleton"

export default function Loading() {
  return (
    <div className="p-6 space-y-6 glassy">
      <CardSkeleton />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <CardSkeleton />
    </div>
  )
}
