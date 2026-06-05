"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { Lock, Eye, EyeOff, CheckCircle2, Loader2 } from "lucide-react"

interface FirstLoginModalProps {
    isOpen: boolean
    onClose: () => void
    userId: string
    userEmail: string
}

/** Marks hasloggedinbefore = true via the server API (bypasses RLS) */
async function markFirstLoginComplete(userId: string) {
    const res = await fetch("/api/auth/complete-first-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
    })
    if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? "Failed to update login status")
    }
}

export default function FirstLoginModal({
    isOpen,
    onClose,
    userId,
    userEmail,
}: FirstLoginModalProps) {
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    // Separate loading flags so the two options don't block each other
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [skipLoading, setSkipLoading] = useState(false)

    const [done, setDone] = useState(false)

    const handleSkip = async () => {
        setSkipLoading(true)
        try {
            sessionStorage.setItem("skippedFirstLogin", "true")
        } catch {}
        onClose()
        // Fire-and-forget — don't block the user
        markFirstLoginComplete(userId).catch((err) =>
            console.error("[skip] markFirstLoginComplete:", err)
        )
        setSkipLoading(false)
    }

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()

        if (newPassword.length < 6) {
            toast({ title: "Too short", description: "Password must be at least 6 characters.", variant: "destructive" })
            return
        }
        if (newPassword !== confirmPassword) {
            toast({ title: "Mismatch", description: "Passwords do not match.", variant: "destructive" })
            return
        }

        setPasswordLoading(true)
        try {
            // 1. Update the Supabase Auth password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            })
            if (updateError) throw updateError

            // 2. Mark first-login complete in the DB
            await markFirstLoginComplete(userId)

            setDone(true)
            toast({ title: "Password updated!", description: "Your new password has been set." })

            // Give the user a moment to see the success state, then close
            setTimeout(() => {
                onClose()
                // Reload so the dashboard re-fetches fresh admin data
                window.location.reload()
            }, 1500)
        } catch (err: any) {
            console.error("[handlePasswordChange]", err)
            toast({
                title: "Update failed",
                description: err.message ?? "Could not update password. Please try again.",
                variant: "destructive",
            })
        } finally {
            setPasswordLoading(false)
        }
    }

    const handleGoogleLink = async () => {
        setGoogleLoading(true)
        try {
            // Mark first-login done before we navigate away
            await markFirstLoginComplete(userId)
            try {
                sessionStorage.setItem("skippedFirstLogin", "true")
            } catch {}

            // linkIdentity links Google to the EXISTING account without signing out.
            // Falls back to signInWithOAuth if linkIdentity is not available (older SDK).
            const { error } = await (supabase.auth as any).linkIdentity
                ? (supabase.auth as any).linkIdentity({
                      provider: "google",
                      options: {
                          redirectTo: `${window.location.origin}/dashboard`,
                      },
                  })
                : supabase.auth.signInWithOAuth({
                      provider: "google",
                      options: {
                          redirectTo: `${window.location.origin}/dashboard`,
                          queryParams: {
                              access_type: "offline",
                              prompt: "consent",
                          },
                      },
                  })

            if (error) throw error
            // The page will navigate away — no need to do anything else
        } catch (err: any) {
            console.error("[handleGoogleLink]", err)
            toast({
                title: "Google sign-in failed",
                description: err.message ?? "Could not connect your Google account.",
                variant: "destructive",
            })
            setGoogleLoading(false)
        }
    }

    if (done) {
        return (
            <Dialog open={isOpen}>
                <DialogContent className="sm:max-w-[380px]">
                    <div className="flex flex-col items-center gap-4 py-8">
                        <CheckCircle2 className="h-14 w-14 text-green-500" />
                        <p className="text-lg font-semibold text-center">Password updated!</p>
                        <p className="text-sm text-muted-foreground text-center">Redirecting you to the dashboard…</p>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleSkip() }}>
            <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-primary" />
                        Security Update Required
                    </DialogTitle>
                    <DialogDescription asChild>
                        <div className="space-y-1 text-sm text-muted-foreground pt-1">
                            <p>Welcome! Since this is your first login, you are using a temporary password.</p>
                            <p className="font-medium text-foreground">Choose how you would like to sign in securely in the future:</p>
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* ── Option 1: Create New Password ── */}
                    <div className="space-y-4">
                        <Divider label="Option 1: Create New Password" />

                        <form onSubmit={handlePasswordChange} className="space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="new-password"
                                        type={showPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Min 6 characters"
                                        required
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        onClick={() => setShowPassword((v) => !v)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm Password</Label>
                                <div className="relative">
                                    <Input
                                        id="confirm-password"
                                        type={showConfirm ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter password"
                                        required
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        onClick={() => setShowConfirm((v) => !v)}
                                        tabIndex={-1}
                                    >
                                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {confirmPassword && newPassword !== confirmPassword && (
                                    <p className="text-xs text-destructive">Passwords don't match</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={passwordLoading || googleLoading}
                            >
                                {passwordLoading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Updating password…
                                    </span>
                                ) : (
                                    "Set New Password"
                                )}
                            </Button>
                        </form>
                    </div>

                    {/* ── Option 2: Google ── */}
                    <div className="space-y-4">
                        <Divider label="Option 2: Use Google Account" />

                        <Button
                            variant="outline"
                            type="button"
                            className="w-full flex items-center gap-2"
                            onClick={handleGoogleLink}
                            disabled={googleLoading || passwordLoading}
                        >
                            {googleLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <GoogleIcon />
                            )}
                            {googleLoading ? "Connecting to Google…" : "Sign in with Google"}
                        </Button>

                        <p className="text-xs text-muted-foreground text-center">
                            Link your Google account (<span className="font-medium">{userEmail}</span>) for one-click sign-in.
                        </p>
                    </div>

                    {/* ── Skip ── */}
                    <div className="pt-2 border-t">
                        <Button
                            variant="ghost"
                            type="button"
                            className="w-full text-muted-foreground hover:text-foreground"
                            onClick={handleSkip}
                            disabled={skipLoading || passwordLoading || googleLoading}
                        >
                            {skipLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Skip for now"}
                        </Button>
                        <p className="text-[10px] text-muted-foreground text-center mt-1">
                            You can change your password later from Profile settings.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

/** Horizontal rule with centred label */
function Divider({ label }: { label: string }) {
    return (
        <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">{label}</span>
            </div>
        </div>
    )
}

/** Official Google "G" SVG icon */
function GoogleIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
            />
            <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
            />
            <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
            />
            <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
            />
        </svg>
    )
}
