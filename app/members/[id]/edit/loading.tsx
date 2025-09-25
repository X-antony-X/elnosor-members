import { ListSkeleton } from "@/components/ui/loading-skeleton"

export default function Loading() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <ListSkeleton count={10} />
    </div>
  )
}
