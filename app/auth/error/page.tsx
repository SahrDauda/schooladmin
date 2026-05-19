export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto max-w-md text-center">
        <h1 className="mb-4 text-2xl font-bold text-foreground">Authentication Error</h1>
        <p className="mb-6 text-muted-foreground">
          There was an error during authentication. Please try again.
        </p>
        <a
          href="/auth/login"
          className="inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          Back to Login
        </a>
      </div>
    </div>
  )
}
