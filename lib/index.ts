// Helper functions for the application

import nodemailer from "nodemailer";

/**
 * Send an email notification
 * @param to Email recipient
 * @param subject Email subject
 * @param body Email body content
 * @returns Promise that resolves when email is sent
 */
export async function sendEmail(to: string, subject: string, body: string) {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, body }),
    })
    return await res.json()
  } catch (error) {
    return { success: false, error }
  }
}

/**
 * Format a date for display
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/**
 * Generate a unique ID
 * @returns Unique ID string
 */
export function generateId(): string {
  return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
