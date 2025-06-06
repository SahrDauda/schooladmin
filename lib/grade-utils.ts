// Generate random grade between 40-95
export const generateRandomGrade = (): number => {
  return Math.floor(Math.random() * (95 - 40 + 1)) + 40
}

// Generate random rank between 1-30
export const generateRandomRank = (): number => {
  return Math.floor(Math.random() * 30) + 1
}

// Determine promotion status based on overall average
export const getPromotionStatus = (overallAverage: number): "Promoted" | "Repeated" | "Pending" => {
  if (overallAverage >= 50) return "Promoted"
  if (overallAverage < 40) return "Repeated"
  return "Pending"
}

// Get status styling
export const getStatusStyling = (status: "Promoted" | "Repeated" | "Pending") => {
  switch (status) {
    case "Promoted":
      return "bg-green-100 text-green-800 border-green-200"
    case "Repeated":
      return "bg-red-100 text-red-800 border-red-200"
    case "Pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

// Limited academic subjects (max 8)
export const limitedAcademicSubjects = [
  "Number Work",
  "Environmental Studies",
  "Integrated Science",
  "Physical Health Ed.",
  "Reading & Comprehension",
  "Home Economic",
  "Literature",
  "Arabic",
]

// Generate mock grade data for a subject and term
export const generateMockGradeData = () => {
  const score1 = generateRandomGrade()
  const score2 = generateRandomGrade()
  const mean = Math.round((score1 + score2) / 2)
  const rank = generateRandomRank()

  return {
    score1,
    score2,
    mean,
    rank,
  }
}
