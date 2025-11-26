"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { Lock, CheckCircle } from "lucide-react"

interface FirstLoginModalProps {
    isOpen: boolean
    onClose: () => void
    userId: string
    userEmail: string
}

export default function FirstLoginModal({ isOpen, onClose, userId, userEmail }: FirstLoginModalProps) {
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()

        if (newPassword !== confirmPassword) {
            toast({
                title: "Error",
                description: "Passwords do not match",
                variant: "destructive",
            })
            return
        }

        if (newPassword.length < 6) {
            toast({
                title: "Error",
                description: "Password must be at least 6 characters long",
                variant: "destructive",
            })
            return
        }

        setIsLoading(true)

        try {
            // 1. Update Password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            })

            if (updateError) throw updateError

            // 2. Update hasloggedinbefore flag
            const { error: dbError } = await supabase
                .from('schooladmin')
                .update({ hasloggedinbefore: true })
                .eq('id', userId)

            if (dbError) throw dbError

            toast({
                title: "Success",
                description: "Password updated successfully! You can now use this password to login.",
            })

            onClose()

            // Force reload to ensure session is refreshed and hasloggedinbefore state is updated
            window.location.reload()
        } catch (error: any) {
            console.error("Error updating password:", error)
            toast({
                title: "Error",
                description: error.message || "Failed to update password",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleLink = async () => {
        setIsLoading(true)
        try {
            // Mark as logged in before redirecting
            await supabase
                .from('schooladmin')
                .update({ hasloggedinbefore: true })
                .eq('id', userId)

            // Initiate OAuth flow
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/dashboard`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            })

            if (error) throw error

            // Note: The user will be redirected, so we don't need to close the modal manually
            // unless the redirect fails or is intercepted.

        } catch (error: any) {
            console.error("Error linking Google account:", error)
            toast({
                title: "Error",
                description: error.message || "Failed to link Google account",
                variant: "destructive",
            })
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-[425px] [&>button]:hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-primary" />
                        Security Update Required
                    </DialogTitle>
                    <DialogDescription className="pt-2" asChild>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <p>
                                Welcome! Since this is your first login, you are using a temporary password.
                            </p>
                            <p className="font-medium text-foreground">
                                Please choose how you would like to sign in securely in the future:
                            </p>
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Option 1: Change Password */}
                    <div className="space-y-4">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Option 1: Create New Password
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handlePasswordChange} className="space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Min 6 characters"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter password"
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Updating..." : "Set New Password"}
                            </Button>
                        </form>
                    </div>

                    {/* Option 2: Google Auth */}
                    <div className="space-y-4">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Option 2: Use Google Account
                                </span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            type="button"
                            className="w-full flex items-center gap-2"
                            onClick={handleGoogleLink}
                            disabled={isLoading}
                        >
                            <svg className="h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                            </svg>
                            Sign in with Google
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                            Link your Google account ({userEmail}) for one-click login.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
