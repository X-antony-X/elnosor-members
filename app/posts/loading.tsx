import { CardSkeleton } from "@/components/ui/loading-skeleton"

export default function Loading() {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto glassy">
      <CardSkeleton />
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
