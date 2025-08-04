"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Edit, Trash2, Eye, AlertTriangle, CheckCircle } from "lucide-react"
import type { ClassWithDetails } from "@/lib/class-utils"

interface ClassTableProps {
  classes: ClassWithDetails[]
  teachers: any[]
  onViewClass: (classData: ClassWithDetails) => void
  onEditClass: (classData: ClassWithDetails) => void
  onDeleteClass: (classId: string) => void
  isLoading?: boolean
}

export function ClassTable({ 
  classes, 
  teachers, 
  onViewClass, 
  onEditClass, 
  onDeleteClass, 
  isLoading = false 
}: ClassTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [sortBy, setSortBy] = useState<"name" | "level" | "students" | "capacity" | "occupancy">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // Get unique level options from classes data
  const levelOptions = useMemo(() => {
    return [...new Set(classes.map((cls) => cls.level))].sort()
  }, [classes])

  // Filter and sort classes
  const filteredAndSortedClasses = useMemo(() => {
    let filtered = classes.filter((cls) => {
      const matchesSearch =
        cls.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.section?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.id?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesLevel = selectedLevel === "all" || cls.level === selectedLevel

      return matchesSearch && matchesLevel
    })

    // Sort classes
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case "name":
          aValue = a.name
          bValue = b.name
          break
        case "level":
          aValue = a.level
          bValue = b.level
          break
        case "students":
          aValue = a.students_count || 0
          bValue = b.students_count || 0
          break
        case "capacity":
          aValue = a.capacity || 0
          bValue = b.capacity || 0
          break
        case "occupancy":
          aValue = a.occupancy_rate || 0
          bValue = b.occupancy_rate || 0
          break
        default:
          aValue = a.name
          bValue = b.name
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [classes, searchQuery, selectedLevel, sortBy, sortOrder])

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  const getOccupancyStatus = (occupancyRate: number) => {
    if (occupancyRate >= 90) return { color: "bg-red-100 text-red-800", icon: <AlertTriangle className="h-3 w-3" /> }
    if (occupancyRate >= 75) return { color: "bg-amber-100 text-amber-800", icon: <AlertTriangle className="h-3 w-3" /> }
    if (occupancyRate >= 50) return { color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="h-3 w-3" /> }
    return { color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3" /> }
  }

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId)
    return teacher ? `${teacher.firstname} ${teacher.lastname}` : "Not Assigned"
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (filteredAndSortedClasses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {classes.length === 0 ? "No classes found." : "No classes match your search criteria."}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
        <div className="flex items-center space-x-2">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-[250px] pl-8"
            />
          </div>
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {levelOptions.map((level, index) => (
                <SelectItem key={index} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {filteredAndSortedClasses.length} of {classes.length} classes
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("name")}
              >
                Class Name
                {sortBy === "name" && (
                  <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("level")}
              >
                Level
                {sortBy === "level" && (
                  <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead>Section</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("students")}
              >
                Students
                {sortBy === "students" && (
                  <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("capacity")}
              >
                Capacity
                {sortBy === "capacity" && (
                  <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("occupancy")}
              >
                Occupancy
                {sortBy === "occupancy" && (
                  <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead>Class Teacher</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedClasses.map((cls) => {
              const occupancyStatus = getOccupancyStatus(cls.occupancy_rate || 0)
              
              return (
                <TableRow
                  key={cls.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={(e) => {
                    if (!(e.target as HTMLElement).closest("button")) {
                      onViewClass(cls)
                    }
                  }}
                >
                  <TableCell className="font-medium">{cls.name}</TableCell>
                  <TableCell>{cls.level}</TableCell>
                  <TableCell>{cls.section || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span>{cls.students_count || 0}</span>
                      {cls.students_count && cls.capacity && (
                        <span className="text-xs text-muted-foreground">
                          / {cls.capacity}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{cls.capacity || "-"}</TableCell>
                  <TableCell>
                    <Badge className={`${occupancyStatus.color} flex items-center space-x-1`}>
                      {occupancyStatus.icon}
                      <span>{cls.occupancy_rate || 0}%</span>
                    </Badge>
                  </TableCell>
                  <TableCell>{cls.teacher_id ? getTeacherName(cls.teacher_id) : "Not Assigned"}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()} className="space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onViewClass(cls)}
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onEditClass(cls)}
                      title="Edit class"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => onDeleteClass(cls.id)}
                      title="Delete class"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 