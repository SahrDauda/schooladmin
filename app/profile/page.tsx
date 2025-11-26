"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import DashboardLayout from "@/components/dashboard-layout"
import { supabase } from "@/lib/supabase"
import { UserCog, Edit, Save, X, Camera } from "lucide-react"

interface AdminProfile {
  id: string
  // Personal Information
  adminname?: string
  adminName?: string
  name?: string
  firstname?: string
  lastname?: string
  middlename?: string
  email?: string
  emailaddress?: string
  phone?: string
  phonenumber?: string
  gender?: string
  nationality?: string
  dateOfBirth?: string
  dob?: string
  marital_status?: string
  religion?: string
  address?: string
  homeaddress?: string

  // School Information
  school_id?: string
  schoolname?: string
  schoolName?: string
  school_name?: string
  academicYear?: string

  // Account Information
  password?: string
  hasloggedinbefore?: boolean
  role?: string
  status?: string

  // Additional Fields
  created_at?: any
  createdAt?: any
  updated_at?: any
  firstLoginAt?: any
  admin_images?: string
  date?: string
  month?: string
  year?: string
  pincode?: string
  [key: string]: any // Allow for any additional fields
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editFormData, setEditFormData] = useState<Partial<AdminProfile>>({})
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>("")

  useEffect(() => {
    const loadProfile = async () => {
      const adminId = localStorage.getItem("adminId")
      if (!adminId) {
        toast({
          title: "Error",
          description: "No admin ID found. Please log in again.",
          variant: "destructive",
        })
        return
      }

      try {
        const { data: adminData, error } = await supabase
          .from('schooladmin')
          .select('*')
          .eq('id', adminId)
          .single()

        if (error) throw error

        if (adminData) {
          setProfile(adminData as AdminProfile)
          setEditFormData({
            // Personal Information
            adminname: adminData.adminname || adminData.adminName || adminData.name || "",
            firstname: adminData.firstname || "",
            lastname: adminData.lastname || "",
            middlename: adminData.middlename || "",
            email: adminData.emailaddress || adminData.email || "",
            phone: adminData.phonenumber || adminData.phone || "",
            gender: adminData.gender || "",
            nationality: adminData.nationality || "",
            dateOfBirth: adminData.dob || adminData.dateOfBirth || "",
            marital_status: adminData.marital_status || "",
            religion: adminData.religion || "",
            address: adminData.homeaddress || adminData.address || "",

            // School Information
            school_id: adminData.school_id || "",
            schoolname: adminData.schoolname || adminData.schoolName || adminData.school_name || "",
            academicYear: adminData.academicYear || "",

            // Account Information
            role: adminData.role || "",
            hasloggedinbefore: adminData.hasloggedinbefore || false,
          })
        }
      } catch (error) {
        console.error("Error loading profile:", error)
        toast({
          title: "Error",
          description: "Failed to load profile information",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "Error",
          description: "File size must be less than 10MB",
          variant: "destructive",
        })
        return
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select an image file",
          variant: "destructive",
        })
        return
      }

      setProfilePicture(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (result) {
          setProfilePicturePreview(result)
        }
      }
      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to load image preview",
          variant: "destructive",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const removeProfilePicture = () => {
    setProfilePicture(null)
    setProfilePicturePreview("")
  }

  const handleSaveProfile = async () => {
    if (!profile) return

    setIsSaving(true)

    try {
      const adminId = localStorage.getItem("adminId")
      if (!adminId) throw new Error("No admin ID found")

      // Handle profile picture upload
      let profilePictureUrl = profile?.admin_images || ""

      if (profilePicture) {
        try {
          const fileExt = profilePicture.name.split('.').pop()
          const fileName = `${adminId}-${Math.random()}.${fileExt}`
          const filePath = `admin-photos/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('teacher-photos') // Reusing teacher-photos bucket or create a new one? Let's assume we use the same or 'admin-photos' if it existed. 
            // Actually, let's stick to 'teacher-photos' for now as we set it up, or better, create a generic 'school-assets' bucket.
            // Given the previous setup, let's try to upload to 'teacher-photos' but maybe we should have a 'avatars' bucket.
            // For now, let's use 'teacher-photos' as it's public read.
            .upload(filePath, profilePicture)

          if (uploadError) throw uploadError

          const { data: { publicUrl } } = supabase.storage
            .from('teacher-photos')
            .getPublicUrl(filePath)

          profilePictureUrl = publicUrl
        } catch (error) {
          console.error("Error uploading profile picture:", error)
          toast({
            title: "Warning",
            description: "Failed to upload profile picture, saving other changes.",
            variant: "destructive",
          })
        }
      }

      const updateData = {
        ...editFormData,
        admin_images: profilePictureUrl,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('schooladmin')
        .update(updateData)
        .eq('id', adminId)

      if (error) throw error

      // Update local state
      setProfile((prev) => prev ? { ...prev, ...updateData } : null)

      // Update localStorage
      if (editFormData.adminname) {
        localStorage.setItem("adminName", editFormData.adminname)
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      })

      setIsEditing(false)
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Password updated successfully",
      })

      setShowPasswordDialog(false)
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error: any) {
      console.error("Error updating password:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getFormattedName = () => {
    if (!profile) return "Admin User"

    const name = profile.adminname || profile.adminName || profile.name || "Admin User"
    let title = ""
    if (profile.gender === "Male") {
      title = "Mr "
    } else if (profile.gender === "Female") {
      title = "Mrs "
    }

    return title + name
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 mt-8">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
          <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Profile Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage
                      src={profilePicturePreview || profile?.admin_images || ""}
                      alt="Profile Picture"
                    />
                    <AvatarFallback className="text-2xl">
                      {getInitials(getFormattedName())}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <div className="absolute -bottom-2 -right-2">
                      <label htmlFor="profile-picture" className="cursor-pointer">
                        <div className="bg-primary text-primary-foreground rounded-full p-1 hover:bg-primary/90">
                          <Camera className="h-4 w-4" />
                        </div>
                        <input
                          id="profile-picture"
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold">{getFormattedName()}</h3>
                  <p className="text-sm text-muted-foreground">Principal</p>
                  <p className="text-sm text-muted-foreground">{profile?.schoolname || profile?.schoolName || "School Admin"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Email:</span>
                  <span className="text-sm">{profile?.emailaddress || profile?.email || "Not provided"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Phone:</span>
                  <span className="text-sm">{profile?.phonenumber || profile?.phone || "Not provided"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Gender:</span>
                  <span className="text-sm">{profile?.gender || "Not specified"}</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowPasswordDialog(true)}
              >
                Change Password
              </Button>
            </CardContent>
          </Card>

          {/* Profile Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="adminname">Full Name</Label>
                        <Input
                          id="adminname"
                          value={editFormData.adminname || ""}
                          onChange={(e) => handleInputChange("adminname", e.target.value)}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={editFormData.email || ""}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          placeholder="Enter your email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={editFormData.phone || ""}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          placeholder="Enter your phone number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select
                          value={editFormData.gender || ""}
                          onValueChange={(value) => handleInputChange("gender", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nationality">Nationality</Label>
                        <Input
                          id="nationality"
                          value={editFormData.nationality || ""}
                          onChange={(e) => handleInputChange("nationality", e.target.value)}
                          placeholder="Enter your nationality"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={editFormData.dateOfBirth || ""}
                          onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="marital_status">Marital Status</Label>
                        <Select
                          value={editFormData.marital_status || ""}
                          onValueChange={(value) => handleInputChange("marital_status", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select marital status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Single">Single</SelectItem>
                            <SelectItem value="Married">Married</SelectItem>
                            <SelectItem value="Divorced">Divorced</SelectItem>
                            <SelectItem value="Widowed">Widowed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="religion">Religion</Label>
                        <Input
                          id="religion"
                          value={editFormData.religion || ""}
                          onChange={(e) => handleInputChange("religion", e.target.value)}
                          placeholder="Enter your religion"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={editFormData.address || ""}
                          onChange={(e) => handleInputChange("address", e.target.value)}
                          placeholder="Enter your address"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Profile Photo */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Profile Photo</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage
                            src={profilePicturePreview || profile?.admin_images || ""}
                            alt="Profile Picture"
                          />
                          <AvatarFallback className="text-lg">
                            {getInitials(getFormattedName())}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-2">
                          <label htmlFor="profile-picture-edit" className="cursor-pointer">
                            <Button variant="outline" size="sm">
                              <Camera className="mr-2 h-4 w-4" />
                              {profilePicture ? "Change Photo" : "Upload Photo"}
                            </Button>
                            <input
                              id="profile-picture-edit"
                              type="file"
                              accept="image/*"
                              onChange={handleProfilePictureChange}
                              className="hidden"
                            />
                          </label>
                          {profilePicture && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={removeProfilePicture}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="mr-2 h-4 w-4" />
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                      {profilePicture && (
                        <div className="text-sm text-muted-foreground">
                          Selected: {profilePicture.name}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">JPG, PNG, GIF up to 10MB</div>
                    </div>
                  </div>

                  {/* School Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">School Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="schoolname">School Name</Label>
                        <Input
                          id="schoolname"
                          value={editFormData.schoolname || ""}
                          onChange={(e) => handleInputChange("schoolname", e.target.value)}
                          placeholder="Enter school name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="school_id">School ID</Label>
                        <Input
                          id="school_id"
                          value={editFormData.school_id || ""}
                          onChange={(e) => handleInputChange("school_id", e.target.value)}
                          placeholder="Enter school ID"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="academicYear">Academic Year</Label>
                        <Input
                          id="academicYear"
                          value={editFormData.academicYear || ""}
                          onChange={(e) => handleInputChange("academicYear", e.target.value)}
                          placeholder="Enter academic year"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Input
                          id="role"
                          value={editFormData.role || ""}
                          onChange={(e) => handleInputChange("role", e.target.value)}
                          placeholder="Enter your role"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Full Name</Label>
                        <p className="text-sm text-muted-foreground">{profile?.adminname || profile?.adminName || profile?.name || "Not provided"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Email</Label>
                        <p className="text-sm text-muted-foreground">{profile?.emailaddress || profile?.email || "Not provided"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Phone Number</Label>
                        <p className="text-sm text-muted-foreground">{profile?.phonenumber || profile?.phone || "Not provided"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Gender</Label>
                        <p className="text-sm text-muted-foreground">{profile?.gender || "Not specified"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Nationality</Label>
                        <p className="text-sm text-muted-foreground">{profile?.nationality || "Not provided"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Date of Birth</Label>
                        <p className="text-sm text-muted-foreground">{profile?.dob || profile?.dateOfBirth || "Not provided"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Marital Status</Label>
                        <p className="text-sm text-muted-foreground">{profile?.marital_status || "Not specified"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Religion</Label>
                        <p className="text-sm text-muted-foreground">{profile?.religion || "Not provided"}</p>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium">Address</Label>
                        <p className="text-sm text-muted-foreground">{profile?.homeaddress || profile?.address || "Not provided"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Profile Photo */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Profile Photo</h3>
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={profile?.admin_images || ""}
                          alt="Profile Picture"
                        />
                        <AvatarFallback className="text-lg">
                          {getInitials(getFormattedName())}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm text-muted-foreground">
                        {profile?.admin_images ? "Profile photo uploaded" : "No profile photo uploaded"}
                      </div>
                    </div>
                  </div>

                  {/* School Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">School Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">School Name</Label>
                        <p className="text-sm text-muted-foreground">{profile?.schoolname || profile?.schoolName || profile?.school_name || "Not provided"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">School ID</Label>
                        <p className="text-sm text-muted-foreground">{profile?.school_id || "Not provided"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Academic Year</Label>
                        <p className="text-sm text-muted-foreground">{profile?.academicYear || "Not provided"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Role</Label>
                        <p className="text-sm text-muted-foreground">{profile?.role || "Not specified"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Password Change Dialog */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Enter your current password and choose a new password.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handlePasswordChange} disabled={isSaving}>
                {isSaving ? "Updating..." : "Update Password"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}