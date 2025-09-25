import { CardSkeleton } from "@/components/ui/loading-skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md glassy">
        <CardSkeleton />
      </div>
    </div>
  )
}
