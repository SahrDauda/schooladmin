"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Edit, Trash2, Eye, UserPlus } from "lucide-react"
import type { StudentWithDetails } from "@/lib/student-utils"

interface StudentTableProps {
  students: StudentWithDetails[]
  classes: any[]
  onViewStudent: (studentData: StudentWithDetails) => void
  onEditStudent: (studentData: StudentWithDetails) => void
  onDeleteStudent: (studentId: string) => void
  onAddParent: (studentData: StudentWithDetails) => void
  isLoading?: boolean
}

export function StudentTable({ 
  students, 
  classes, 
  onViewStudent, 
  onEditStudent, 
  onDeleteStudent,
  onAddParent,
  isLoading = false 
}: StudentTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedClass, setSelectedClass] = useState("all")
  const [sortBy, setSortBy] = useState<"name" | "admission" | "class" | "status">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // Filter and sort students
  const filteredAndSortedStudents = useMemo(() => {
    let filtered = students.filter((student) => {
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch =
        student.firstname?.toLowerCase().includes(searchLower) ||
        student.lastname?.toLowerCase().includes(searchLower) ||
        student.admission_number?.toLowerCase().includes(searchLower) ||
        student.id?.toLowerCase().includes(searchLower)

      const matchesClass = selectedClass === "all" || student.class_id === selectedClass

      return matchesSearch && matchesClass
    })

    // Sort students
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case "name":
          aValue = `${a.firstname} ${a.lastname}`
          bValue = `${b.firstname} ${b.lastname}`
          break
        case "admission":
          aValue = a.admission_number || ""
          bValue = b.admission_number || ""
          break
        case "class":
          aValue = a.class_name || ""
          bValue = b.class_name || ""
          break
        case "status":
          aValue = a.status || ""
          bValue = b.status || ""
          break
        default:
          aValue = `${a.firstname} ${a.lastname}`
          bValue = `${b.firstname} ${b.lastname}`
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [students, searchQuery, selectedClass, sortBy, sortOrder])

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase()
    if (s === "active") return "bg-green-100 text-green-800"
    if (s === "inactive" || s === "suspended") return "bg-red-100 text-red-800"
    if (s === "graduated") return "bg-blue-100 text-blue-800"
    return "bg-gray-100 text-gray-800"
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (filteredAndSortedStudents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {students.length === 0 ? "No students found." : "No students match your search criteria."}
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
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-[250px] pl-8"
            />
          </div>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {filteredAndSortedStudents.length} of {students.length} students
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
                Name
                {sortBy === "name" && (
                  <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("admission")}
              >
                Admission No.
                {sortBy === "admission" && (
                  <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("class")}
              >
                Class
                {sortBy === "class" && (
                  <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead>Gender</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("status")}
              >
                Status
                {sortBy === "status" && (
                  <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedStudents.map((student) => {
              return (
                <TableRow
                  key={student.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={(e) => {
                    if (!(e.target as HTMLElement).closest("button")) {
                      onViewStudent(student)
                    }
                  }}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      {student.passport_url ? (
                        <img 
                          src={student.passport_url} 
                          alt="avatar" 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                          {student.firstname?.charAt(0)}{student.lastname?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div>{student.firstname} {student.lastname}</div>
                        {student.guardian_phone && (
                          <div className="text-xs text-muted-foreground">{student.guardian_phone}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{student.admission_number || "-"}</TableCell>
                  <TableCell>
                    {student.class_name ? `${student.class_name}` : "Not Assigned"}
                  </TableCell>
                  <TableCell>{student.gender || "-"}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(student.status || "")}>
                      {student.status || "Unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                    <div className="flex justify-end items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onViewStudent(student)}
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onAddParent(student)}
                        title="Link/Add Parent"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onEditStudent(student)}
                        title="Edit student"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => onDeleteStudent(student.id)}
                        title="Delete student"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
