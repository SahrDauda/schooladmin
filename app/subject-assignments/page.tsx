"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { Plus, Users, BookOpen, Trash2, Search, Filter } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { getCurrentSchoolInfo } from "@/lib/school-utils"
import {
    assignStudentToSubject,
    description: "Failed to fetch data",
    variant: "destructive",
})
            } finally {
    setIsLoading(false)
}
        }

fetchData()
    }, [admin])

const handleAssignStudents = async () => {
    if (!selectedSubject || selectedStudents.length === 0) {
        toast({
            title: "Error",
            description: "Please select a subject and at least one student",
            variant: "destructive",
        })
        return
    }

    try {
        await bulkAssignStudentsToSubject(
            selectedStudents,
            selectedSubject,
            schoolInfo.school_id,
            admin?.id || "",
            new Date().getFullYear().toString(),
            "Full Year"
        )

        toast({
            title: "Success",
            description: `${selectedStudents.length} student(s) assigned to subject successfully`,
        })

        // Refresh assignments
        const newAssignments = await getSubjectAssignments(schoolInfo.school_id)
        setAssignments(newAssignments)

        // Reset form
        setSelectedSubject("")
        setSelectedStudents([])
        setIsAssignDialogOpen(false)
    } catch (error) {
        console.error("Error assigning students:", error)
        toast({
            title: "Error",
            description: "Failed to assign students to subject",
            variant: "destructive",
        })
    }
}

const handleRemoveAssignment = async (assignmentId: string) => {
    try {
        await removeStudentFromSubject(assignmentId)

        // Update local state
        setAssignments(prev => prev.filter(a => a.id !== assignmentId))

        toast({
            title: "Success",
            description: "Student removed from subject successfully",
        })
    } catch (error) {
        console.error("Error removing assignment:", error)
        toast({
            title: "Error",
            description: "Failed to remove student from subject",
            variant: "destructive",
        })
    }
}

const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    return student ? `${student.firstname} ${student.lastname}` : "Unknown Student"
}

const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId)
    return subject ? subject.name : "Unknown Subject"
}

const getClassName = (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    return student?.class || "Unknown Class"
}

// Filter assignments based on search and subject filter
const filteredAssignments = assignments.filter(assignment => {
    const studentName = getStudentName(assignment.student_id).toLowerCase()
    const subjectName = getSubjectName(assignment.subject_id).toLowerCase()
    const matchesSearch = studentName.includes(searchTerm.toLowerCase()) ||
        subjectName.includes(searchTerm.toLowerCase())
    const matchesSubject = filterSubject === "all" || assignment.subject_id === filterSubject

    return matchesSearch && matchesSubject
})

// Get students not yet assigned to the selected subject
const getAvailableStudents = () => {
    if (!selectedSubject) return students

    const assignedStudentIds = assignments
        .filter(a => a.subject_id === selectedSubject && a.status === "active")
        .map(a => a.student_id)

    return students.filter(student => !assignedStudentIds.includes(student.id))
}

if (isLoading) {
    return (
        <DashboardLayout>
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        </DashboardLayout>
    )
}

return (
    <DashboardLayout>
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 mt-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Subject Assignments</h1>
                    <p className="text-muted-foreground">Manage which students take which subjects</p>
                </div>
                <Button onClick={() => setIsAssignDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Assign Students to Subject
                </Button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{students.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{subjects.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{assignments.filter(a => a.status === "active").length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Search students or subjects..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <Select value={filterSubject} onValueChange={setFilterSubject}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Filter by subject" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Subjects</SelectItem>
                                {subjects.map((subject) => (
                                    <SelectItem key={subject.id} value={subject.id}>
                                        {subject.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Assignments Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Current Subject Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredAssignments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p>No subject assignments found</p>
                            <p className="text-sm">Start by assigning students to subjects</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Academic Year</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAssignments.map((assignment) => (
                                    <TableRow key={assignment.id}>
                                        <TableCell className="font-medium">
                                            {getStudentName(assignment.student_id)}
                                        </TableCell>
                                        <TableCell>{getClassName(assignment.student_id)}</TableCell>
                                        <TableCell>{getSubjectName(assignment.subject_id)}</TableCell>
                                        <TableCell>{assignment.academic_year || "N/A"}</TableCell>
                                        <TableCell>
                                            <Badge variant={assignment.status === "active" ? "default" : "secondary"}>
                                                {assignment.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRemoveAssignment(assignment.id!)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Remove
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Assign Students Dialog */}
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Assign Students to Subject</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Select Subject</label>
                            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map((subject) => (
                                        <SelectItem key={subject.id} value={subject.id}>
                                            {subject.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedSubject && (
                            <div>
                                <label className="text-sm font-medium">Select Students</label>
                                <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-2">
                                    {getAvailableStudents().map((student) => (
                                        <div key={student.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={student.id}
                                                checked={selectedStudents.includes(student.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedStudents(prev => [...prev, student.id])
                                                    } else {
                                                        setSelectedStudents(prev => prev.filter(id => id !== student.id))
                                                    }
                                                }}
                                            />
                                            <label
                                                htmlFor={student.id}
                                                className="text-sm cursor-pointer flex-1"
                                            >
                                                {student.firstname} {student.lastname} - {student.class}
                                            </label>
                                        </div>
                                    ))}
                                    {getAvailableStudents().length === 0 && (
                                        <p className="text-sm text-muted-foreground py-2">
                                            All students are already assigned to this subject
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAssignStudents}
                            disabled={!selectedSubject || selectedStudents.length === 0}
                        >
                            Assign {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    </DashboardLayout>
)
} 