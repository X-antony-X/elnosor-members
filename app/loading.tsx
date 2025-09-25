import { ListSkeleton } from "@/components/ui/loading-skeleton"

export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      <ListSkeleton count={5} />
    </div>
  )
}
