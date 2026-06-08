export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>
    if (typeof record.message === "string" && record.message) {
      return record.message
    }
    if (typeof record.error === "string" && record.error) {
      return record.error
    }
    if (typeof record.details === "string" && record.details) {
      return record.details
    }
  }

  return "An unexpected error occurred"
}
