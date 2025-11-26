"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { UserPlus, ArrowLeft, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AddAdminPage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        adminname: "",
        emailaddress: "",
        password: "",
        gender: "",
        role: "Principal",
        schoolName: "",
        schoolStage: "",
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target
        setFormData((prev) => ({ ...prev, [id]: value }))
    }

    const handleSelectChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            if (!formData.adminname || !formData.emailaddress || !formData.password || !formData.schoolName || !formData.schoolStage) {
                toast({
                    title: "Validation Error",
                    description: "Please fill in all required fields",
                    variant: "destructive",
                })
                setIsSubmitting(false)
                return
            }

            // 1. Create Auth User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.emailaddress,
                password: formData.password,
                options: {
                    data: {
                        name: formData.adminname,
                        role: formData.role,
                    },
                },
            })

            if (authError) {
                if (authError.message.includes("already registered")) {
                    throw new Error(`Email already registered. Use a different email.`)
                }
                throw new Error(`Auth Error: ${authError.message}`)
            }

            if (!authData.user) {
                throw new Error("Failed to create user account")
            }

            // 2. Create School Record
            // We generate a UUID for the school to ensure we have it for the admin record
            const schoolId = crypto.randomUUID()

            const { error: schoolError } = await supabase
                .from("schools")
                .insert({
                    id: schoolId,
                    name: formData.schoolName,
                    stage: formData.schoolStage,
                    created_at: new Date().toISOString(),
                })

            if (schoolError) {
                console.error("School creation error:", schoolError)
                // Cleanup auth user if school creation fails
                // Note: We cannot delete the auth user from the client side as we don't have admin rights.
                // The user will exist in Auth but have no school record.
                throw new Error(`Failed to create school: ${schoolError.message}`)
            }

            // 3. Create Admin Record
            const { error: adminError } = await supabase
                .from("schooladmin")
                .insert({
                    id: authData.user.id, // Link to Auth User ID
                    email: formData.emailaddress, // Use 'email' column as per schema
                    name: formData.adminname,
                    adminname: formData.adminname,
                    role: formData.role,
                    gender: formData.gender,
                    school_id: schoolId, // Link to the new School
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    hasloggedinbefore: false,
                })

            if (adminError) {
                console.error("Admin profile creation error:", adminError)
                // Try to cleanup school
                try {
                    await supabase.from("schools").delete().eq("id", schoolId)
                } catch (error) {
                    console.error("Failed to cleanup school:", error)
                }
                // We cannot delete the auth user from the client side
                throw new Error(`Failed to create admin profile: ${adminError.message}`)
            }

            toast({
                title: "Success",
                description: "Admin account created successfully!",
            })

            setFormData({
                adminname: "",
                emailaddress: "",
                password: "",
                gender: "",
                role: "Principal",
                schoolName: "",
                schoolStage: "",
            })

            setTimeout(() => router.push("/"), 2000)

        } catch (error: any) {
            console.error("Submission error:", error)
            toast({
                title: "Error",
                description: error.message || "Failed to create admin",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
            <Card className="w-full max-w-2xl shadow-lg">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <UserPlus className="h-6 w-6 text-primary" />
                            <CardTitle>Add School Admin</CardTitle>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                    </div>
                    <CardDescription>Create a new school administrator</CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Note</AlertTitle>
                        <AlertDescription>
                            Use a unique email for each admin.
                        </AlertDescription>
                    </Alert>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="adminname">Admin Name <span className="text-red-500">*</span></Label>
                                <Input id="adminname" value={formData.adminname} onChange={handleInputChange} placeholder="John Doe" required />
                            </div>

                            <div>
                                <Label htmlFor="emailaddress">Email <span className="text-red-500">*</span></Label>
                                <Input id="emailaddress" type="email" value={formData.emailaddress} onChange={handleInputChange} placeholder="admin@school.com" required />
                            </div>

                            <div>
                                <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                                <Input id="password" type="password" value={formData.password} onChange={handleInputChange} placeholder="Min 6 chars" minLength={6} required />
                            </div>

                            <div>
                                <Label htmlFor="gender">Gender</Label>
                                <Select onValueChange={(value) => handleSelectChange("gender", value)} value={formData.gender}>
                                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="role">Role</Label>
                                <Select onValueChange={(value) => handleSelectChange("role", value)} value={formData.role}>
                                    <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Principal">Principal</SelectItem>
                                        <SelectItem value="Vice Principal">Vice Principal</SelectItem>
                                        <SelectItem value="Admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="schoolName">School Name <span className="text-red-500">*</span></Label>
                                <Input id="schoolName" value={formData.schoolName} onChange={handleInputChange} placeholder="School Name" required />
                            </div>

                            <div>
                                <Label htmlFor="schoolStage">School Stage <span className="text-red-500">*</span></Label>
                                <Select onValueChange={(value) => handleSelectChange("schoolStage", value)} value={formData.schoolStage}>
                                    <SelectTrigger><SelectValue placeholder="Select school stage" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Primary">Primary</SelectItem>
                                        <SelectItem value="Junior Secondary">Junior Secondary</SelectItem>
                                        <SelectItem value="Senior Secondary">Senior Secondary</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Creating...</>
                                ) : (
                                    <><UserPlus className="h-4 w-4 mr-2" />Create Admin</>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
