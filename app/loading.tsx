import { ListSkeleton } from "@/components/ui/loading-skeleton"

export default function Loading() {
  return (
    <div className="p-6 space-y-6 glassy">
      <ListSkeleton count={5} />
    </div>
  )
}
