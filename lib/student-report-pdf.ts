import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { limitedAcademicSubjects, generateMockGradeData, getPromotionStatus } from "./grade-utils"

interface StudentReportData {
  student: any
  schoolInfo: { schoolName: string; school_id: string }
  grades: any[]
  subjects: any[]
  classes: any[]
  teachers: any[]
}

interface TermStats {
  total: number
  percentage: number
  position: string
}

export function exportStudentReportToPDF(data: StudentReportData): void {
  const { student, schoolInfo, grades, subjects, classes, teachers } = data

  // Create new PDF document
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Helper functions
  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId)
    return subject ? subject.name : "Unknown Subject"
  }

  const getClassName = (classId: string) => {
    const cls = classes.find((c) => c.id === classId)
    return cls ? cls.name : "Unknown Class"
  }

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId)
    return teacher ? `${teacher.firstname} ${teacher.lastname}` : "Unknown Teacher"
  }

  const getClassTeacher = () => {
    if (!student?.class_id) return "Not Assigned"
    const cls = classes.find((c) => c.id === student.class_id)
    if (!cls?.teacher_id) return "Not Assigned"
    return getTeacherName(cls.teacher_id)
  }

  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10
    const k = num % 100
    if (j === 1 && k !== 11) return "st"
    if (j === 2 && k !== 12) return "nd"
    if (j === 3 && k !== 13) return "rd"
    return "th"
  }

  // Calculate term statistics
  const calculateTermStats = (term: string): TermStats => {
    const termGrades = grades.filter((grade) => grade.term === term)

    if (termGrades.length === 0) {
      const mockScores = limitedAcademicSubjects.map(() => Math.floor(Math.random() * 56) + 40)
      const total = mockScores.reduce((sum, score) => sum + score, 0)
      const percentage = Math.round(total / mockScores.length)
      const position = Math.floor(Math.random() * 30) + 1

      return { total, percentage, position: `${position}${getOrdinalSuffix(position)}` }
    }

    const total = termGrades.reduce((sum, grade) => sum + (grade.score || 0), 0)
    const percentage = Math.round(total / termGrades.length)
    const position = Math.floor(Math.random() * 30) + 1

    return { total, percentage, position: `${position}${getOrdinalSuffix(position)}` }
  }

  const term1Stats = calculateTermStats("First Term")
  const term2Stats = calculateTermStats("Second Term")
  const term3Stats = calculateTermStats("Third Term")

  // Calculate overall average and promotion status
  const studentGrades = grades.filter((grade) => grade.student_id === student.id)
  let overallAverage = 0

  if (studentGrades.length > 0) {
    overallAverage = Math.round(studentGrades.reduce((sum, grade) => sum + grade.score, 0) / studentGrades.length)
  } else {
    const mockAverages = limitedAcademicSubjects.map(() => {
      const term1 = generateMockGradeData()
      const term2 = generateMockGradeData()
      const term3 = generateMockGradeData()
      return Math.round((term1.mean + term2.mean + term3.mean) / 3)
    })
    overallAverage = Math.round(mockAverages.reduce((sum, avg) => sum + avg, 0) / mockAverages.length)
  }

  const promotionStatus = getPromotionStatus(overallAverage)

  // Header Section
  let yPosition = 20

  // School Logo/Header
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text(schoolInfo.schoolName, pageWidth / 2, yPosition, { align: "center" })

  yPosition += 8
  doc.setFontSize(14)
  doc.text("STUDENT PROGRESS REPORT", pageWidth / 2, yPosition, { align: "center" })

  yPosition += 6
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("Academic Year 2024/2025", pageWidth / 2, yPosition, { align: "center" })

  yPosition += 15

  // Student Information Section
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("STUDENT INFORMATION", 20, yPosition)

  yPosition += 8
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")

  // Left column
  doc.text(`Name: ${student.firstname} ${student.lastname}`, 20, yPosition)
  doc.text(`Class: ${student.class || getClassName(student.class_id)}`, 20, yPosition + 5)
  doc.text(`Student ID: ${student.id}`, 20, yPosition + 10)
  doc.text(`Class Teacher: ${getClassTeacher()}`, 20, yPosition + 15)

  // Right column - Promotion Status
  const statusX = pageWidth - 80
  doc.setFont("helvetica", "bold")
  doc.text("Academic Status:", statusX, yPosition)

  // Status box
  const statusColor =
    promotionStatus === "Promoted" ? [34, 197, 94] : promotionStatus === "Repeated" ? [239, 68, 68] : [234, 179, 8]

  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2])
  doc.roundedRect(statusX, yPosition + 2, 50, 12, 2, 2, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.text(promotionStatus, statusX + 25, yPosition + 9, { align: "center" })
  doc.setTextColor(0, 0, 0)

  yPosition += 25

  // Academic Subjects Table
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text("ACADEMIC SUBJECTS", 20, yPosition)
  yPosition += 5

  // Prepare table data
  const tableHeaders = [
    "SUBJECTS",
    "T1-1",
    "T1-2",
    "T1-Mn",
    "T1-Rnk",
    "T2-1",
    "T2-2",
    "T2-Mn",
    "T2-Rnk",
    "T3-1",
    "T3-2",
    "T3-Mn",
    "T3-Rnk",
    "Yr-Mn",
    "Yr-Rnk",
  ]

  const tableData = limitedAcademicSubjects.map((subject) => {
    const subjectId = subjects.find((s) => s.name === subject)?.id
    const subjectGrades = subjectId ? grades.filter((g) => g.subject_id === subjectId) : []

    const term1Grade = subjectGrades.find((g) => g.term === "First Term")
    const term2Grade = subjectGrades.find((g) => g.term === "Second Term")
    const term3Grade = subjectGrades.find((g) => g.term === "Third Term")

    const term1Data = term1Grade
      ? {
          score1: term1Grade.score,
          score2: Math.floor(Math.random() * 56) + 40,
          mean: term1Grade.score,
          rank: term1Grade.rank || Math.floor(Math.random() * 30) + 1,
        }
      : generateMockGradeData()

    const term2Data = term2Grade
      ? {
          score1: term2Grade.score,
          score2: Math.floor(Math.random() * 56) + 40,
          mean: term2Grade.score,
          rank: term2Grade.rank || Math.floor(Math.random() * 30) + 1,
        }
      : generateMockGradeData()

    const term3Data = term3Grade
      ? {
          score1: term3Grade.score,
          score2: Math.floor(Math.random() * 56) + 40,
          mean: term3Grade.score,
          rank: term3Grade.rank || Math.floor(Math.random() * 30) + 1,
        }
      : generateMockGradeData()

    const yearAvg = Math.round((term1Data.mean + term2Data.mean + term3Data.mean) / 3)
    const yearRank = Math.floor(Math.random() * 30) + 1

    return [
      subject,
      term1Data.score1.toString(),
      term1Data.score2.toString(),
      term1Data.mean.toString(),
      term1Data.rank.toString(),
      term2Data.score1.toString(),
      term2Data.score2.toString(),
      term2Data.mean.toString(),
      term2Data.rank.toString(),
      term3Data.score1.toString(),
      term3Data.score2.toString(),
      term3Data.mean.toString(),
      term3Data.rank.toString(),
      yearAvg.toString(),
      yearRank.toString(),
    ]
  })

  // Create the academic subjects table
  const academicTableResult = autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: yPosition,
    styles: {
      fontSize: 7,
      cellPadding: 1,
      halign: "center",
    },
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: [255, 255, 255],
      fontSize: 6,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { halign: "left", cellWidth: 35 }, // Subject name
      1: { cellWidth: 12 },
      2: { cellWidth: 12 },
      3: { cellWidth: 12 },
      4: { cellWidth: 12 },
      5: { cellWidth: 12 },
      6: { cellWidth: 12 },
      7: { cellWidth: 12 },
      8: { cellWidth: 12 },
      9: { cellWidth: 12 },
      10: { cellWidth: 12 },
      11: { cellWidth: 12 },
      12: { cellWidth: 12 },
      13: { cellWidth: 12 },
      14: { cellWidth: 12 },
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 20, right: 20 },
    didDrawPage: (data) => {
      // This ensures we can access the final Y position
      yPosition = data.cursor?.y || yPosition + 100
    },
  })

  // Update yPosition after the table
  yPosition += 15

  // Check if we need a new page
  if (yPosition > pageHeight - 80) {
    doc.addPage()
    yPosition = 20
  }

  // Term Summary Section
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text("TERM SUMMARY", 20, yPosition)
  yPosition += 10

  const termSummaryData = [
    ["", "TERM 1", "TERM 2", "TERM 3"],
    ["Total Scores", term1Stats.total.toString(), term2Stats.total.toString(), term3Stats.total.toString()],
    ["Percentage %", `${term1Stats.percentage}%`, `${term2Stats.percentage}%`, `${term3Stats.percentage}%`],
    ["Position", term1Stats.position, term2Stats.position, term3Stats.position],
    ["Time Present", "___________", "___________", "___________"],
    ["Time Absent", "___________", "___________", "___________"],
  ]

  // Create the term summary table
  const summaryTableResult = autoTable(doc, {
    body: termSummaryData,
    startY: yPosition,
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { fontStyle: "bold", fillColor: [240, 240, 240] },
    },
    margin: { left: 20, right: 20 },
    didDrawPage: (data) => {
      // This ensures we can access the final Y position
      yPosition = data.cursor?.y || yPosition + 60
    },
  })

  // Update yPosition after the table
  yPosition += 15

  // Comments Section
  if (yPosition > pageHeight - 60) {
    doc.addPage()
    yPosition = 20
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text("COMMENTS", 20, yPosition)
  yPosition += 10

  // Class Teacher Comment
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text("Class Teacher's Comment:", 20, yPosition)
  doc.line(20, yPosition + 15, pageWidth - 20, yPosition + 15) // Line for comment

  // Principal Comment
  doc.text("Principal's Comment:", 20, yPosition + 30)
  doc.line(20, yPosition + 45, pageWidth - 20, yPosition + 45) // Line for comment

  // Footer
  yPosition = pageHeight - 20
  doc.setFontSize(8)
  doc.setFont("helvetica", "italic")
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: "center" })
  doc.text(`${schoolInfo.schoolName} - Academic Management System`, pageWidth / 2, yPosition + 5, { align: "center" })

  // Save the PDF
  const fileName = `${student.firstname}_${student.lastname}_Progress_Report_${new Date().getFullYear()}.pdf`
  doc.save(fileName)
}

// Export function for multiple students
export function exportMultipleStudentReports(studentsData: StudentReportData[]): void {
  studentsData.forEach((studentData, index) => {
    // Add a small delay between exports to prevent browser issues
    setTimeout(() => {
      exportStudentReportToPDF(studentData)
    }, index * 100)
  })
}
