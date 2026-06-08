import { supabase } from "@/lib/supabase"

export interface LoginFieldError {
  field: "email" | "password" | null
  message: string
}

export function validateLoginFields(email: string, password: string): LoginFieldError | null {
  const trimmedEmail = email.trim()

  if (!trimmedEmail) {
    return { field: "email", message: "Email address is required." }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmedEmail)) {
    return { field: "email", message: "Please enter a valid email address." }
  }

  if (!password) {
    return { field: "password", message: "Password is required." }
  }

  return null
}

export async function adminAccountExists(email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase()

  const { data: byEmail } = await supabase
    .from("schooladmin")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle()

  if (byEmail) return true

  const { data: byEmailAddress } = await supabase
    .from("schooladmin")
    .select("id")
    .eq("emailaddress", normalizedEmail)
    .maybeSingle()

  return Boolean(byEmailAddress)
}

export async function resolveLoginFailureMessage(
  email: string,
  authError: { message?: string } | null
): Promise<LoginFieldError> {
  if (!authError) {
    return { field: null, message: "Login failed. Please try again." }
  }

  const msg = (authError.message || "").toLowerCase()

  if (msg.includes("email not confirmed")) {
    return { field: "email", message: "Please verify your email address before signing in." }
  }

  if (msg.includes("invalid login credentials") || msg.includes("invalid email or password")) {
    const exists = await adminAccountExists(email)
    if (!exists) {
      return { field: "email", message: "No account found with this email address." }
    }
    return { field: "password", message: "Incorrect password. Please try again." }
  }

  if (msg.includes("too many requests")) {
    return { field: null, message: "Too many login attempts. Please wait a moment and try again." }
  }

  return { field: null, message: authError.message || "Login failed. Please try again." }
}
