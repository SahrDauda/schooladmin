import { toast } from "@/hooks/use-toast"

export interface ErrorInfo {
  code?: string
  message: string
  details?: string
  timestamp: Date
  userId?: string
  action?: string
  module?: 'schooladmin' | 'staff'
}

export class AppError extends Error {
  public code: string
  public details?: string
  public timestamp: Date
  public userId?: string
  public action?: string
  public module?: 'schooladmin' | 'staff'

  constructor(message: string, code: string = 'UNKNOWN_ERROR', details?: string) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = details
    this.timestamp = new Date()
  }
}

export const ErrorCodes = {
  // Authentication Errors
  AUTH_FAILED: 'AUTH_FAILED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // Database Errors
  DB_CONNECTION_FAILED: 'DB_CONNECTION_FAILED',
  DB_QUERY_FAILED: 'DB_QUERY_FAILED',
  DB_WRITE_FAILED: 'DB_WRITE_FAILED',
  DOCUMENT_NOT_FOUND: 'DOCUMENT_NOT_FOUND',
  
  // Validation Errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Business Logic Errors
  DUPLICATE_RECORD: 'DUPLICATE_RECORD',
  INVALID_OPERATION: 'INVALID_OPERATION',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  
  // Network Errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  API_ERROR: 'API_ERROR',
  
  // System Errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export const ErrorMessages = {
  [ErrorCodes.AUTH_FAILED]: 'Authentication failed. Please log in again.',
  [ErrorCodes.INVALID_CREDENTIALS]: 'Invalid email or password.',
  [ErrorCodes.SESSION_EXPIRED]: 'Your session has expired. Please log in again.',
  [ErrorCodes.UNAUTHORIZED]: 'You are not authorized to perform this action.',
  
  [ErrorCodes.DB_CONNECTION_FAILED]: 'Unable to connect to database.',
  [ErrorCodes.DB_QUERY_FAILED]: 'Failed to retrieve data from database.',
  [ErrorCodes.DB_WRITE_FAILED]: 'Failed to save data to database.',
  [ErrorCodes.DOCUMENT_NOT_FOUND]: 'The requested record was not found.',
  
  [ErrorCodes.VALIDATION_FAILED]: 'Please check your input and try again.',
  [ErrorCodes.INVALID_INPUT]: 'The provided data is invalid.',
  [ErrorCodes.MISSING_REQUIRED_FIELD]: 'Please fill in all required fields.',
  
  [ErrorCodes.DUPLICATE_RECORD]: 'A record with this information already exists.',
  [ErrorCodes.INVALID_OPERATION]: 'This operation is not allowed.',
  [ErrorCodes.RESOURCE_NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCodes.PERMISSION_DENIED]: 'You do not have permission to perform this action.',
  
  [ErrorCodes.NETWORK_ERROR]: 'Network error. Please check your connection.',
  [ErrorCodes.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
  [ErrorCodes.API_ERROR]: 'An error occurred while processing your request.',
  
  [ErrorCodes.UNKNOWN_ERROR]: 'An unexpected error occurred.',
  [ErrorCodes.INTERNAL_ERROR]: 'An internal error occurred. Please try again later.',
} as const

export const handleError = (
  error: Error | AppError | unknown,
  context?: {
    action?: string
    userId?: string
    module?: 'schooladmin' | 'staff'
  }
): ErrorInfo => {
  let errorInfo: ErrorInfo

  if (error instanceof AppError) {
    errorInfo = {
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: error.timestamp,
      userId: error.userId || context?.userId,
      action: error.action || context?.action,
      module: error.module || context?.module,
    }
  } else if (error instanceof Error) {
    errorInfo = {
      message: error.message,
      timestamp: new Date(),
      userId: context?.userId,
      action: context?.action,
      module: context?.module,
    }
  } else {
    errorInfo = {
      message: 'An unknown error occurred',
      timestamp: new Date(),
      userId: context?.userId,
      action: context?.action,
      module: context?.module,
    }
  }

  // Log error for debugging
  console.error('Error occurred:', errorInfo)
  
  // Show user-friendly toast message
  const userMessage = ErrorMessages[errorInfo.code as keyof typeof ErrorMessages] || errorInfo.message
  
  toast({
    title: "Error",
    description: userMessage,
    variant: "destructive",
  })

  return errorInfo
}

export const createError = (
  message: string,
  code: keyof typeof ErrorCodes = 'UNKNOWN_ERROR',
  details?: string
): AppError => {
  return new AppError(message, ErrorCodes[code], details)
}

export const validateRequired = (value: any, fieldName: string): void => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    throw createError(
      `${fieldName} is required`,
      'MISSING_REQUIRED_FIELD',
      `Field: ${fieldName}`
    )
  }
}

export const validateEmail = (email: string): void => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw createError(
      'Please enter a valid email address',
      'INVALID_INPUT',
      `Invalid email format: ${email}`
    )
  }
}

export const validatePassword = (password: string): void => {
  if (password.length < 6) {
    throw createError(
      'Password must be at least 6 characters long',
      'INVALID_INPUT',
      'Password validation failed'
    )
  }
}

export const validateSchoolId = (schoolId: string): void => {
  if (!schoolId || schoolId === 'unknown' || schoolId === 'error') {
    throw createError(
      'School information not found. Please log in again.',
      'RESOURCE_NOT_FOUND',
      'School ID validation failed'
    )
  }
}

export const validateUserId = (userId: string): void => {
  if (!userId) {
    throw createError(
      'User session not found. Please log in again.',
      'AUTH_FAILED',
      'User ID validation failed'
    )
  }
}

export const handleAsyncError = async <T>(
  asyncFn: () => Promise<T>,
  context?: {
    action?: string
    userId?: string
    module?: 'schooladmin' | 'staff'
  }
): Promise<T> => {
  try {
    return await asyncFn()
  } catch (error) {
    handleError(error, context)
    throw error
  }
}

export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: {
    action?: string
    userId?: string
    module?: 'schooladmin' | 'staff'
  }
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      handleError(error, context)
      throw error
    }
  }
}

// Error boundary helper
export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError
}

export const getErrorMessage = (error: unknown): string => {
  if (isAppError(error)) {
    return ErrorMessages[error.code as keyof typeof ErrorMessages] || error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred'
}

// Retry mechanism for transient errors
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      // Don't retry for certain error types
      if (error instanceof AppError) {
        if ([ErrorCodes.AUTH_FAILED, ErrorCodes.UNAUTHORIZED, ErrorCodes.PERMISSION_DENIED].includes(error.code)) {
          throw error
        }
      }
      
      if (attempt === maxRetries) {
        throw error
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }
  
  throw lastError!
} 