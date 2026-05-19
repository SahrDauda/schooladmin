"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { UserPlus, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AddAdminPage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [createdAdmin, setCreatedAdmin] = useState<{ email: string; schoolName: string } | null>(null)
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
        setCreatedAdmin(null)

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

            // Call the server API to create school and admin
            const response = await fetch("/api/admin/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    adminname: formData.adminname,
                    email: formData.emailaddress,
                    password: formData.password,
                    gender: formData.gender,
                    role: formData.role,
                    schoolName: formData.schoolName,
                    schoolStage: formData.schoolStage,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to create admin")
            }

            toast({
                title: "Success",
                description: "School and admin account created successfully!",
            })

            setCreatedAdmin({
                email: formData.emailaddress,
                schoolName: formData.schoolName,
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
                    {createdAdmin ? (
                        <Alert className="mb-4 border-green-200 bg-green-50">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertTitle className="text-green-800">Admin Created Successfully!</AlertTitle>
                            <AlertDescription className="text-green-700">
                                <p className="mt-2">
                                    <strong>School:</strong> {createdAdmin.schoolName}
                                </p>
                                <p>
                                    <strong>Email:</strong> {createdAdmin.email}
                                </p>
                                <p className="mt-3 text-sm">
                                    The admin can now log in using the email and password provided.
                                </p>
                                <div className="mt-4 flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setCreatedAdmin(null)}
                                    >
                                        Add Another Admin
                                    </Button>
                                    <Button 
                                        size="sm"
                                        onClick={() => router.push("/")}
                                    >
                                        Go to Login
                                    </Button>
                                </div>
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <>
                            <Alert className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Demo Mode</AlertTitle>
                                <AlertDescription>
                                    Create a school and admin account. The admin can immediately log in after creation.
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

                                    <div className="md:col-span-2">
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
                                            <><UserPlus className="h-4 w-4 mr-2" />Create School &amp; Admin</>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
