import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Users, GraduationCap, AlertTriangle, CheckCircle } from "lucide-react"

interface ClassMetricsProps {
  metrics: {
    totalClasses: number
    totalStudents: number
    totalCapacity: number
    averageOccupancy: number
    fullClasses: number
    emptyClasses: number
  }
}

export function ClassMetrics({ metrics }: ClassMetricsProps) {
  const getOccupancyColor = (rate: number) => {
    if (rate >= 90) return "text-red-500"
    if (rate >= 75) return "text-amber-500"
    if (rate >= 50) return "text-blue-500"
    return "text-green-500"
  }

  const getOccupancyIcon = (rate: number) => {
    if (rate >= 90) return <AlertTriangle className="h-4 w-4 text-red-500" />
    if (rate >= 75) return <AlertTriangle className="h-4 w-4 text-amber-500" />
    return <CheckCircle className="h-4 w-4 text-green-500" />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
          <BookOpen className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalClasses}</div>
          <p className="text-xs text-muted-foreground">
            Active classes in the system
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          <Users className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalStudents}</div>
          <p className="text-xs text-muted-foreground">
            Enrolled across all classes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
          <GraduationCap className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalCapacity}</div>
          <p className="text-xs text-muted-foreground">
            Maximum student capacity
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
          {getOccupancyIcon(metrics.averageOccupancy)}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getOccupancyColor(metrics.averageOccupancy)}`}>
            {metrics.averageOccupancy}%
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.fullClasses} full, {metrics.emptyClasses} empty
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 