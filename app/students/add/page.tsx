"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { doc, setDoc, Timestamp, getDoc, collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import DashboardLayout from "@/components/dashboard-layout"
import { z } from "zod"
import { Button } from "@/components/ui/button" // Ensure Button is imported
import { Search } from "lucide-react"
import { generateAdmissionNumber } from "@/lib/school-utils"

const studentSchema = z.object({
  firstname: z.string().min(2, "First name must be at least 2 characters"),
  lastname: z.string().min(2, "Last name must be at least 2 characters"),
  batch: z.string().min(1, "Academic year is required"),
  school_id: z.string().min(1, "School ID is required"),
  adm_no: z.string().min(1, "Admission number is required"),
  schoolname: z.string().min(1, "School name is required"),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  class: z.string().min(1, "Class is required"),
  homeaddress: z.string().min(1, "Home address is required"),
  nationality: z.string().min(1, "Nationality is required"),
  // Optional fields
  nin: z.string().optional(),
  bgroup: z.string().optional(),
  faculty: z.string().optional(), // Made optional
  level: z.string().min(1, "Level is required"), // Level is always required
  phonenumber: z.string().optional(),
  emailaddress: z.string().email().optional().or(z.literal("")),
  religion: z.string().optional(),
  disability: z.string().optional(),
  disability_type: z.string().optional(),
  sick: z.string().optional(),
  sick_type: z.string().optional(),
})

export default function AddStudentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    batch: "",
    school_id: "",
    adm_no: "",
    id_no: "",
    schoolname: "",
    firstname: "",
    lastname: "",
    dob: "",
    gender: "",
    bgroup: "",
    class_id: "",
    class: "",
    faculty: "",
    level: "",
    homeaddress: "",
    phonenumber: "",
    emailaddress: "",
    nin: "",
    religion: "",
    nationality: "",
    disability: "",
    disability_type: "",
    sick: "",
    sick_type: "",
  })

  const [classes, setClasses] = useState<any[]>([])
  const [schoolStage, setSchoolStage] = useState<string | null>(null)
  const [levelOptions, setLevelOptions] = useState<string[]>([])
  const [isSearchingNIN, setIsSearchingNIN] = useState(false)

  useEffect(() => {
    // Fetch classes for the dropdown
    const fetchClasses = async () => {
      try {
        const classesRef = collection(db, "classes")
        const classesSnapshot = await getDocs(classesRef)
        const classesList = classesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setClasses(classesList)
      } catch (error) {
        console.error("Error fetching classes:", error)
      }
    }

    // Fetch school admin data to auto-populate fields and get school stage
    const fetchSchoolAdminAndStage = async () => {
      try {
        const adminId = localStorage.getItem("adminId")
        if (adminId) {
          const adminDoc = await getDoc(doc(db, "schooladmin", adminId))
          if (adminDoc.exists()) {
            const adminData = adminDoc.data()
            const currentSchoolId = adminData.school_id || adminId
            const currentSchoolName = adminData.schoolName || "Holy Family Junior Secondary School"

            setFormData((prev) => ({
              ...prev,
              school_id: currentSchoolId,
              schoolname: currentSchoolName,
            }))

            // Auto-generate admission number
            const currentYear = new Date().getFullYear().toString()
            const admissionNumber = await generateAdmissionNumber(currentSchoolId, currentYear)
            setFormData((prev) => ({
              ...prev,
              adm_no: admissionNumber,
              batch: currentYear,
            }))

            // Now fetch the stage from the 'schools' collection using currentSchoolId
            const schoolDoc = await getDoc(doc(db, "schools", currentSchoolId))
            if (schoolDoc.exists()) {
              setSchoolStage(schoolDoc.data().stage || "senior secondary")
            } else {
              setSchoolStage("senior secondary") // Default if school doc doesn't exist
            }
          } else {
            setSchoolStage("senior secondary") // Default if admin doc doesn't exist
          }
        } else {
          setSchoolStage("senior secondary") // Default if no adminId
        }
      } catch (error) {
        console.error("Error fetching school admin data or stage:", error)
        setSchoolStage("senior secondary") // Default on error
      }
    }

    fetchClasses()
    fetchSchoolAdminAndStage()
  }, [])

  // Effect to update level options based on schoolStage
  useEffect(() => {
    if (schoolStage === "primary") {
      setLevelOptions(["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6"])
    } else if (schoolStage === "junior secondary") {
      setLevelOptions(["JSS 1", "JSS 2", "JSS 3"])
    } else if (schoolStage === "senior secondary") {
      setLevelOptions(["SSS 1", "SSS 2", "SSS 3"])
    } else {
      setLevelOptions([]) // Default or empty if stage is unknown
    }
  }, [schoolStage])

  // NIN API integration
  const searchNINFromAPI = async (nin: string) => {
    setIsSearchingNIN(true)
    try {
      console.log('Searching for NIN:', nin)
      const response = await fetch('/api/nin-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nin: nin })
      })
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      console.log('Response headers:', response.headers)
        
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: NIN not found`)
      }
      
      const data = await response.json()
      console.log('API response data:', data)
      
      // Check if the API returned valid data
      if (!data || !data.firstName || !data.lastName) {
        console.log('Invalid data structure:', data)
        throw new Error('Invalid NIN data received')
      }
      
      // Auto-populate form with NIN data
      setFormData((prev) => ({
        ...prev,
        firstname: data.firstName || prev.firstname,
        lastname: data.lastName || prev.lastname,
        dob: data.dateOfBirth || prev.dob,
        gender: data.gender || prev.gender,
        nationality: data.nationality || prev.nationality,
        homeaddress: data.address || prev.homeaddress,
        phonenumber: data.phoneNumber || prev.phonenumber,
        emailaddress: data.emailaddress || prev.emailaddress,
        level: data.level || prev.level,
        faculty: data.faculty || prev.faculty,
        nin: nin
      }))
      
      console.log('Form updated with NIN data')
      
      toast({
        title: "Success",
        description: `Student information retrieved for ${data.firstName} ${data.lastName}`,
      })
    } catch (error) {
      console.error('NIN search failed:', error)
      
      // Show specific error message based on the error
      let errorMessage = "NIN verification failed"
      if (error instanceof Error) {
        if (error.message.includes('404') || error.message.includes('not found')) {
          errorMessage = `NIN "${nin}" not found in the database`
        } else if (error.message.includes('Invalid NIN data')) {
          errorMessage = "Invalid data received from NIN database"
        } else if (error.message.includes('fetch')) {
          errorMessage = "Network error - please check your connection"
        }
      }
      
      toast({
        title: "NIN Not Found",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSearchingNIN(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepare data for validation, conditionally removing 'faculty' if not applicable
      const dataToValidate = { ...formData }
      if (schoolStage === "primary" || schoolStage === "junior secondary") {
        delete (dataToValidate as { faculty?: string }).faculty
      }

      // Validate form data
      const validatedData = studentSchema.parse(dataToValidate)

      // Generate a unique ID if admission number is not provided
      const studentId = formData.adm_no || `ST${Date.now().toString().slice(-6)}`

      // Add timestamp and metadata
      const currentDate = new Date()
      const studentData = {
        ...formData,
        id: studentId,
        status: "Active",
        created_at: Timestamp.fromDate(currentDate),
        date: currentDate.toLocaleDateString(),
        month: currentDate.toLocaleString("default", { month: "long" }),
        year: currentDate.getFullYear().toString(),
      }

      // Save to Firestore
      await setDoc(doc(db, "students", studentId), studentData)

      toast({
        title: "Success",
        description: "Student added successfully",
      })

      router.push("/students")
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        })
        return
      }
      console.error("Error adding student:", error)
      toast({
        title: "Error",
        description: "Failed to add student",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl sm:text-2xl">Add New Student</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Enter student details to register them in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Search by NIN */}
              <div className="mb-6 p-4 border rounded-md bg-gray-50">
                <h3 className="text-sm font-medium mb-2">Search by National ID Number (NIN)</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter NIN to search"
                    value={formData.nin}
                    onChange={(e) => setFormData({ ...formData, nin: e.target.value })}
                  />
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => searchNINFromAPI(formData.nin)}
                    disabled={isSearchingNIN || !formData.nin}
                    className="whitespace-nowrap"
                  >
                    {isSearchingNIN ? (
                      <span className="flex items-center">
                        <span className="animate-spin mr-2">⏳</span> Searching...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Search className="w-4 h-4 mr-2" /> Search by NIN
                      </span>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter the student's National ID Number to automatically fill their information. Test NINs: SL12345678, SL87654321, SL11223344
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Basic Information */}
                <div className="space-y-2">
                  <Label htmlFor="batch" className="text-sm sm:text-base">
                    Academic Year
                  </Label>
                  <Input
                    id="batch"
                    className="h-9 sm:h-10"
                    value={formData.batch}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    placeholder="e.g. 2023-2024"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adm_no">Admission Number</Label>
                  <Input
                    id="adm_no"
                    value={formData.adm_no}
                    readOnly
                    className="bg-gray-50"
                    placeholder="Will be auto-generated"
                  />
                </div>
                {/* Hidden fields for school data */}
                <input type="hidden" id="school_id" value={formData.school_id} />
                <input type="hidden" id="schoolname" value={formData.schoolname} />
                <div className="space-y-2">
                  <Label htmlFor="firstname">First Name</Label>
                  <Input
                    id="firstname"
                    value={formData.firstname}
                    onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastname">Last Name</Label>
                  <Input
                    id="lastname"
                    value={formData.lastname}
                    onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                    required
                  />
                </div>

                {/* Personal Information */}
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, gender: value })}>
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
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bgroup">Blood Group</Label>
                  <Select
                    onValueChange={(value) => setFormData({ ...formData, bgroup: value })}
                    defaultValue="Not Known"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Not Known">Not Known</SelectItem>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Academic Information */}
                <div className="space-y-2">
                  <Label htmlFor="class">Class</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, class: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.name}>
                          {cls.name} {cls.section || ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Conditionally render Faculty field */}
                {schoolStage !== "primary" && schoolStage !== "junior secondary" && (
                  <div className="space-y-2">
                    <Label htmlFor="faculty">Faculty</Label>
                    <Select onValueChange={(value) => setFormData({ ...formData, faculty: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select faculty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Science">Science</SelectItem>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                        <SelectItem value="Arts">Arts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="level">Level</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, level: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {levelOptions.map((level, index) => (
                        <SelectItem key={index} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Contact Information */}
                <div className="space-y-2">
                  <Label htmlFor="homeaddress">Home Address</Label>
                  <Input
                    id="homeaddress"
                    value={formData.homeaddress}
                    onChange={(e) => setFormData({ ...formData, homeaddress: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phonenumber">Phone Number</Label>
                  <Input
                    id="phonenumber"
                    value={formData.phonenumber}
                    onChange={(e) => setFormData({ ...formData, phonenumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailaddress">Email Address</Label>
                  <Input
                    id="emailaddress"
                    type="email"
                    value={formData.emailaddress}
                    onChange={(e) => setFormData({ ...formData, emailaddress: e.target.value })}
                  />
                </div>

                {/* Additional Information */}
                <div className="space-y-2">
                  <Label htmlFor="religion">Religion</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, religion: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select religion" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Christianity">Christianity</SelectItem>
                      <SelectItem value="Islam">Islam</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, nationality: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select nationality" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {[
                        "Sierra Leone", "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
                      ].map((country, idx, arr) => arr.indexOf(country) === idx && <SelectItem key={country} value={country}>{country}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nin">National ID Number (NIN)</Label>
                  <Input
                    id="nin"
                    value={formData.nin}
                    onChange={(e) => setFormData({ ...formData, nin: e.target.value })}
                  />
                </div>

                {/* Health Information */}
                <div className="space-y-2">
                  <Label htmlFor="disability">Disability</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, disability: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.disability === "Yes" && (
                  <div className="space-y-2">
                    <Label htmlFor="disability_type">Type of Disability</Label>
                    <Input
                      id="disability_type"
                      value={formData.disability_type}
                      onChange={(e) => setFormData({ ...formData, disability_type: e.target.value })}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="sick">Medical Condition</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, sick: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.sick === "Yes" && (
                  <div className="space-y-2">
                    <Label htmlFor="sick_type">Type of Medical Condition</Label>
                    <Input
                      id="sick_type"
                      value={formData.sick_type}
                      onChange={(e) => setFormData({ ...formData, sick_type: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/students")}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? "Adding..." : "Add Student"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
