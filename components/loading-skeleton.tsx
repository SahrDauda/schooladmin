import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function StatCardSkeleton() {
  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div className="h-4 w-24 bg-gray-200 animate-pulse rounded-md"></div>
        <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full"></div>
      </CardHeader>
      <CardContent>
        <div className="h-6 w-12 bg-gray-200 animate-pulse rounded-md"></div>
      </CardContent>
    </Card>
  )
}

export function ChartSkeleton() {
  return (
    <div className="h-[250px] w-full bg-gray-100 animate-pulse rounded-md flex items-center justify-center">
      <p className="text-gray-400">Loading chart data...</p>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full space-y-2">
      <div className="h-8 w-full bg-gray-200 animate-pulse rounded-md"></div>
      {Array(rows)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="h-12 w-full bg-gray-100 animate-pulse rounded-md"></div>
        ))}
    </div>
  )
}
