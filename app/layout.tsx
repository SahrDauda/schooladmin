import type React from "react"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/error-boundary"
import { AuthProvider } from "@/hooks/use-auth"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Skultɛk",
  description: "School Management System",
  generator: 'DigiSal',
  icons: {
    icon: '/schooltech.png',
    apple: '/schooltech.png'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <ThemeProvider attribute="class" defaultTheme="light">
          <ErrorBoundary>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ErrorBoundary>
          <Toaster />
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('unhandledrejection', function(event) {
                console.error('Unhandled promise rejection:', event.reason);
                event.preventDefault();
              });
            `,
          }}
        />
      </body>
    </html>
  )
}
