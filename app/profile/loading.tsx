import { CardSkeleton } from "@/components/ui/loading-skeleton"

export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      <CardSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  )
}
