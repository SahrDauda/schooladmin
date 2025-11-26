      })
    } finally {
  setLoading(false)
}
  }

return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader>
        <CardTitle className="text-center">
          {isFirstTimeLogin ? "Set Your Password" : "Create New Password"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">
              {isFirstTimeLogin ? "Setting password for:" : "Creating new password for:"}
            </p>
            <p className="font-medium">{email}</p>
            {isFirstTimeLogin && (
              <p className="text-xs text-muted-foreground mt-2">
                Welcome! Please set your password to complete your account setup.
              </p>
            )}
          </div>

          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground focus:outline-none"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (isFirstTimeLogin ? "Setting..." : "Updating...") : (isFirstTimeLogin ? "Set Password" : "Update Password")}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
)
} 