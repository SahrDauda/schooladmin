"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { 
  User, 
  BookOpen, 
  Users, 
  HeartPulse, 
  ArrowRight, 
  ArrowLeft, 
  Check,
  Search,
  Plus,
  Link as LinkIcon,
  ShieldCheck,
  Camera
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { generateAdmissionNumber } from "@/lib/school-utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const STEPS = [
  { id: 1, name: "Bio-data", icon: User },
  { id: 2, name: "Placement", icon: BookOpen },
  { id: 3, name: "Family Link", icon: Users },
  { id: 4, name: "Medical/Misc", icon: HeartPulse },
]

export default function AddStudentPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [schoolId, setSchoolId] = useState("")
  const [schoolName, setSchoolName] = useState("")
  const [schoolStage, setSchoolStage] = useState("senior secondary")
  const [classes, setClasses] = useState<any[]>([])
  const [levelOptions, setLevelOptions] = useState<string[]>([])

  // Student Form State
  const [studentData, setStudentData] = useState({
    firstname: "",
    lastname: "",
    othernames: "",
    gender: "",
    dateofbirth: "",
    nationality: "Sierra Leone",
    nin: "",
    admission_number: "",
    batch: new Date().getFullYear().toString(),
    class_id: "",
    level: "",
    faculty: "",
    address: "",
    religion: "Christianity",
    disability: "No",
    disability_type: "",
    medical_condition: "No",
    medical_details: "",
    passport_url: ""
  })

  // Parent Linking State
  const [parentType, setParentType] = useState<"new" | "existing">("new")
  const [parentSearchQuery, setParentSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedParent, setSelectedParent] = useState<any>(null)
  const [parentData, setParentData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    occupation: "",
    relationship: "Mother"
  })

  useEffect(() => {
    const adminId = localStorage.getItem("adminId")
    if (!adminId) {
      router.push("/")
      return
    }

    const initData = async () => {
      try {
        const { data: admin } = await supabase.from('schooladmin').select('*').eq('id', adminId).single()
        if (admin) {
          const sId = admin.school_id || adminId
          setSchoolId(sId)
          setSchoolName(admin.schoolName || "My School")
          
          // Fetch school stage
          const { data: school } = await supabase.from('schools').select('stage').eq('id', sId).single()
          if (school) setSchoolStage(school.stage)

          // Auto-generate admission number
          const year = new Date().getFullYear().toString()
          const admNo = await generateAdmissionNumber(sId, year)
          setStudentData(prev => ({ ...prev, admission_number: admNo, batch: year }))

          // Fetch classes
          const { data: classesList } = await supabase.from('classes').select('*').eq('school_id', sId)
          setClasses(classesList || [])
        }
      } catch (e) {
        console.error(e)
      }
    }
    initData()
  }, [])

  useEffect(() => {
    if (schoolStage === "primary") {
      setLevelOptions(["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6"])
    } else if (schoolStage === "junior secondary") {
      setLevelOptions(["JSS 1", "JSS 2", "JSS 3"])
    } else {
      setLevelOptions(["SSS 1", "SSS 2", "SSS 3"])
    }
  }, [schoolStage])

  const searchParents = async () => {
    if (!parentSearchQuery) return
    const { data } = await supabase
      .from('parents')
      .select('*')
      .or(`firstname.ilike.%${parentSearchQuery}%,lastname.ilike.%${parentSearchQuery}%,family_id.ilike.%${parentSearchQuery}%`)
      .limit(5)
    setSearchResults(data || [])
  }

  const handleFinalSubmit = async () => {
    setLoading(true)
    try {
      let finalParentId = selectedParent?.id

      // 1. If new parent, create them first
      if (parentType === "new") {
        const { data: newP, error: pErr } = await supabase
          .from('parents')
          .insert({
            ...parentData,
            school_id: schoolId,
            family_id: `FAM-${Math.floor(Math.random() * 900000) + 100000}`
          })
          .select()
          .single()
        
        if (pErr) throw pErr
        finalParentId = newP.id
      }

      // 2. Create Student
      const { error: sErr } = await supabase
        .from('students')
        .insert({
          ...studentData,
          school_id: schoolId,
          parent_id: finalParentId,
          status: "Active"
        })

      if (sErr) throw sErr

      toast({
        title: "Registration Complete",
        description: `${studentData.firstname} has been successfully admitted.`,
      })
      router.push("/students")
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={studentData.firstname} onChange={e => setStudentData({...studentData, firstname: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={studentData.lastname} onChange={e => setStudentData({...studentData, lastname: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={studentData.dateofbirth} onChange={e => setStudentData({...studentData, dateofbirth: e.target.value})} />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={studentData.gender} onValueChange={v => setStudentData({...studentData, gender: v})}>
                  <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>National ID (NIN)</Label>
                <Input value={studentData.nin} onChange={e => setStudentData({...studentData, nin: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Home Address</Label>
                <Input value={studentData.address} onChange={e => setStudentData({...studentData, address: e.target.value})} />
              </div>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-500">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Admission Number</Label>
                <Input value={studentData.admission_number} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Academic Batch</Label>
                <Input value={studentData.batch} onChange={e => setStudentData({...studentData, batch: e.target.value})} />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Level</Label>
                <Select value={studentData.level} onValueChange={v => setStudentData({...studentData, level: v})}>
                  <SelectTrigger><SelectValue placeholder="Select Level" /></SelectTrigger>
                  <SelectContent>
                    {levelOptions.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assigned Class</Label>
                <Select value={studentData.class_id} onValueChange={v => setStudentData({...studentData, class_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="flex bg-muted/30 p-1 rounded-lg w-fit">
              <Button 
                variant={parentType === "new" ? "default" : "ghost"} 
                size="sm" 
                onClick={() => setParentType("new")}
              >New Parent/Guardian</Button>
              <Button 
                variant={parentType === "existing" ? "default" : "ghost"} 
                size="sm" 
                onClick={() => setParentType("existing")}
              >Existing Family / Sibling Link</Button>
            </div>

            {parentType === "existing" ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Search by Parent Name or Family ID..." 
                    value={parentSearchQuery} 
                    onChange={e => setParentSearchQuery(e.target.value)} 
                  />
                  <Button variant="secondary" onClick={searchParents}><Search className="w-4 h-4 mr-2"/>Search</Button>
                </div>
                <div className="grid gap-2">
                  {searchResults.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => setSelectedParent(p)}
                      className={cn(
                        "flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all",
                        selectedParent?.id === p.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar><AvatarFallback>{p.firstname[0]}{p.lastname[0]}</AvatarFallback></Avatar>
                        <div>
                          <p className="font-bold">{p.firstname} {p.lastname}</p>
                          <p className="text-xs text-muted-foreground">Family ID: {p.family_id}</p>
                        </div>
                      </div>
                      {selectedParent?.id === p.id && <Check className="text-primary w-5 h-5"/>}
                    </div>
                  ))}
                  {selectedParent && (
                    <div className="mt-4 p-4 rounded-xl border border-dashed border-emerald-500 bg-emerald-50/50 flex items-center gap-3 text-emerald-800">
                      <LinkIcon className="w-5 h-5" />
                      <p className="text-sm font-medium">Sibling Link Confirmed: Surnames don't have to match!</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Guardian First Name</Label>
                  <Input value={parentData.firstname} onChange={e => setParentData({...parentData, firstname: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Guardian Last Name</Label>
                  <Input value={parentData.lastname} onChange={e => setParentData({...parentData, lastname: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input value={parentData.phone} onChange={e => setParentData({...parentData, phone: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Relationship</Label>
                  <Select value={parentData.relationship} onValueChange={v => setParentData({...parentData, relationship: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Father">Father</SelectItem>
                      <SelectItem value="Mother">Mother</SelectItem>
                      <SelectItem value="Guardian">Guardian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        )
      case 4:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-500">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Religion</Label>
                <Select value={studentData.religion} onValueChange={v => setStudentData({...studentData, religion: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Christianity">Christianity</SelectItem>
                    <SelectItem value="Islam">Islam</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Disability Status</Label>
                <Select value={studentData.disability} onValueChange={v => setStudentData({...studentData, disability: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Medical Condition</Label>
                <Select value={studentData.medical_condition} onValueChange={v => setStudentData({...studentData, medical_condition: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {studentData.medical_condition === "Yes" && (
                <div className="space-y-2">
                  <Label>Condition Details</Label>
                  <Input value={studentData.medical_details} onChange={e => setStudentData({...studentData, medical_details: e.target.value})} placeholder="e.g. Asthma" />
                </div>
              )}
            </div>
          </div>
        )
      default: return null
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight">Student Admission</h2>
          <p className="text-muted-foreground italic">
            Refining academic entry for {schoolName} • {schoolStage.toUpperCase()}
          </p>
        </div>

        {/* Stepper Header */}
        <div className="relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2 z-0" />
          <div className={cn(
            "absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-500",
            currentStep === 1 ? "w-0" : currentStep === 2 ? "w-1/3" : currentStep === 3 ? "w-2/3" : "w-full"
          )} />
          
          <div className="relative z-10 flex justify-between">
            {STEPS.map((step) => (
              <div key={step.id} className="flex flex-col items-center gap-2">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                  currentStep >= step.id 
                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                    : "bg-background border-muted text-muted-foreground"
                )}>
                  <step.icon className="w-5 h-5" />
                </div>
                <span className={cn(
                  "text-xs font-bold uppercase tracking-tighter",
                  currentStep >= step.id ? "text-primary" : "text-muted-foreground"
                )}>{step.name}</span>
              </div>
            ))}
          </div>
        </div>

        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Step {currentStep}: {STEPS.find(s => s.id === currentStep)?.name}</CardTitle>
                <CardDescription>Fill in the required information to proceed.</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">{Math.round((currentStep / STEPS.length) * 100)}% Complete</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="min-h-[300px]">
              {renderStepContent()}
            </div>
          </CardContent>
          <div className="flex items-center justify-between p-6 border-t bg-muted/10">
            <Button 
              variant="outline" 
              onClick={prevStep} 
              disabled={currentStep === 1 || loading}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            
            {currentStep < STEPS.length ? (
              <Button onClick={nextStep} className="gap-2 px-8">
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleFinalSubmit} disabled={loading} className="gap-2 px-10 bg-emerald-600 hover:bg-emerald-700 text-white">
                {loading ? "Processing Admisson..." : <><ShieldCheck className="w-4 h-4"/> Finalize Admission</>}
              </Button>
            )}
          </div>
        </Card>

        {currentStep === 1 && (
          <div className="p-6 rounded-2xl border border-dashed border-primary/30 bg-primary/5 flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm">International Standard Data Protection</p>
              <p className="text-xs text-muted-foreground">This system uses encrypted storage and complies with EMIS standards for student data integrity.</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
