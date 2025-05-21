import { jsPDF } from "jspdf"
import "jspdf-autotable"
import * as XLSX from "xlsx"

// Helper to convert data to CSV
export function convertToCSV(data: any[], headers: { key: string; label: string }[]): string {
  // Create header row
  const headerRow = headers.map((h) => h.label).join(",")

  // Create data rows
  const rows = data
    .map((item) => {
      return headers
        .map((header) => {
          // Get the value using the key
          let value = item[header.key]

          // Handle undefined or null values
          if (value === undefined || value === null) {
            return ""
          }

          // Convert objects or arrays to string
          if (typeof value === "object") {
            value = JSON.stringify(value)
          }

          // Escape commas and quotes
          value = String(value).replace(/"/g, '""')
          if (value.includes(",") || value.includes('"') || value.includes("\n")) {
            value = `"${value}"`
          }

          return value
        })
        .join(",")
    })
    .join("\n")

  return `${headerRow}\n${rows}`
}

// Export to CSV
export function exportToCSV(data: any[], headers: { key: string; label: string }[], filename: string): void {
  const csv = convertToCSV(data, headers)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Export to Excel
export function exportToExcel(data: any[], headers: { key: string; label: string }[], filename: string): void {
  // Create a worksheet with headers
  const worksheet = XLSX.utils.json_to_sheet(
    data.map((item) => {
      const row: Record<string, any> = {}
      headers.forEach((header) => {
        row[header.label] = item[header.key]
      })
      return row
    }),
  )

  // Create a workbook
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1")

  // Generate Excel file
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

// Export to PDF
export function exportToPDF(
  data: any[],
  headers: { key: string; label: string }[],
  filename: string,
  title: string,
  schoolName: string,
): void {
  // Create new PDF document
  const doc = new jsPDF()

  // Add school name at the top
  doc.setFontSize(16)
  doc.text(schoolName, doc.internal.pageSize.getWidth() / 2, 15, { align: "center" })

  // Add title
  doc.setFontSize(14)
  doc.text(title, doc.internal.pageSize.getWidth() / 2, 25, { align: "center" })

  // Add current date
  const currentDate = new Date().toLocaleDateString()
  doc.setFontSize(10)
  doc.text(`Generated on: ${currentDate}`, doc.internal.pageSize.getWidth() / 2, 32, { align: "center" })

  // Prepare data for autotable
  const tableHeaders = headers.map((h) => h.label)
  const tableData = data.map((item) =>
    headers.map((header) => {
      const value = item[header.key]
      if (value === undefined || value === null) return ""
      if (typeof value === "object") return JSON.stringify(value)
      return String(value)
    }),
  )

  // Add table to PDF
  // @ts-ignore - jspdf-autotable extends jsPDF prototype
  doc.autoTable({
    head: [tableHeaders],
    body: tableData,
    startY: 40,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [66, 66, 66] },
    alternateRowStyles: { fillColor: [240, 240, 240] },
  })

  // Save PDF
  doc.save(`${filename}.pdf`)
}

// Format data for export (common preprocessing)
export function prepareDataForExport(data: any[], excludeFields: string[] = []): any[] {
  return data.map((item) => {
    const exportItem: Record<string, any> = {}

    // Copy all fields except excluded ones
    Object.keys(item).forEach((key) => {
      if (!excludeFields.includes(key)) {
        // Handle special cases
        if (key === "created_at" || key === "updated_at") {
          if (item[key]?.toDate) {
            exportItem[key] = item[key].toDate().toLocaleDateString()
          } else if (item[key] instanceof Date) {
            exportItem[key] = item[key].toLocaleDateString()
          } else {
            exportItem[key] = item[key]
          }
        } else {
          exportItem[key] = item[key]
        }
      }
    })

    return exportItem
  })
}
