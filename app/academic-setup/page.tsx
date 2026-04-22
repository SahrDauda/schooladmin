"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Settings2, 
  DoorOpen, 
  Save, 
  Plus, 
  Trash2, 
  Info,
  Calculator,
  ShieldCheck,
  History
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

interface GradeSettings {
  id?: string
  school_id: string
  ca1_weight: number
  ca2_weight: number
  exam_weight: number
  pass_mark: number
}

interface Room {
  id: string
  name: string
  capacity: number
  type: string
}

export default function AcademicSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [schoolId, setSchoolId] = useState<string | null>(null)
  
  // Grade Formula State
  const [formula, setFormula] = useState<GradeSettings>({
    school_id: "",
    ca1_weight: 20,
    ca2_weight: 20,
    exam_weight: 60,
    pass_mark: 40
  })

  // Rooms State
  const [rooms, setRooms] = useState<Room[]>([])
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false)
  const [newRoom, setNewRoom] = useState({ name: "", capacity: 30, type: "Classroom" })

  useEffect(() => {
    const adminId = localStorage.getItem("adminId")
    if (!adminId) {
      router.push("/")
      return
    }

    const fetchData = async () => {
      setLoading(true)
      try {
        // 1. Get School ID
        const { data: adminData } = await supabase
          .from('schooladmin')
          .select('school_id')
          .eq('id', adminId)
          .single()
        
        const currentSchoolId = adminData?.school_id || adminId
        setSchoolId(currentSchoolId)

        // 2. Fetch Grade Formula
        const { data: formulaData, error: formulaError } = await supabase
          .from('grade_settings')
          .select('*')
          .eq('school_id', currentSchoolId)
          .single()

        if (formulaData) {
          setFormula(formulaData)
        } else {
          setFormula(prev => ({ ...prev, school_id: currentSchoolId }))
        }

        // 3. Fetch Rooms
        const { data: roomsData } = await supabase
          .from('rooms')
          .select('*')
          .eq('school_id', currentSchoolId)
        
        setRooms(roomsData || [])
        
      } catch (error) {
        console.error("Error fetching setup data:", error)
        toast({
          title: "Setup Data Error",
          description: "Could not load settings. Ensure migration script is run.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleSaveFormula = async () => {
    if (!schoolId) return
    
    // Validation
    if (formula.ca1_weight + formula.ca2_weight + formula.exam_weight !== 100) {
      toast({
        title: "Invalid Formula",
        description: "Weights must total 100%",
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('grade_settings')
        .upsert({ ...formula, school_id: schoolId })

      if (error) throw error

      toast({
        title: "Success",
        description: "Grading formula updated successfully."
      })
    } catch (error) {
      console.error("Save error:", error)
      toast({
        title: "Error",
        description: "Failed to save grading formula.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddRoom = async () => {
    if (!schoolId || !newRoom.name) return
    
    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert({ ...newRoom, school_id: schoolId })
        .select()
        .single()

      if (error) throw error

      setRooms([data, ...rooms])
      setIsAddRoomOpen(false)
      setNewRoom({ name: "", capacity: 30, type: "Classroom" })
      
      toast({
        title: "Room Added",
        description: `${newRoom.name} successfully registered.`
      })
    } catch (error) {
      console.error("Room add error:", error)
      toast({
        title: "Error",
        description: "Failed to add room.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteRoom = async (id: string) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', id)

      if (error) throw error

      setRooms(rooms.filter(r => r.id !== id))
      toast({
        title: "Room Deleted",
        description: "Room removed from registry."
      })
    } catch (error) {
      console.error("Delete error:", error)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Academic Setup</h2>
          <p className="text-muted-foreground mt-1">
            Configure school-wide grading policies and facility management.
          </p>
        </div>

        <Tabs defaultValue="formula" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 lg:grid-cols-3 mb-4 h-12">
            <TabsTrigger value="formula" className="gap-2 h-10">
              <Calculator className="h-4 w-4" />
              Grading Formula
            </TabsTrigger>
            <TabsTrigger value="rooms" className="gap-2 h-10">
              <DoorOpen className="h-4 w-4" />
              Rooms & Facilities
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 h-10">
              <ShieldCheck className="h-4 w-4" />
              Policy & Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="formula">
            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader className="border-b bg-muted/20">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">School-Wide Grading Formula</CardTitle>
                    <CardDescription>Define the weights for C.A. and Final Exams.</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1.5 px-3">
                    <Settings2 className="h-3 w-3" />
                    Global Rule
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-8 space-y-8">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-blue-800 text-sm">
                  <Info className="h-5 w-5 shrink-0" />
                  <p>
                    <strong>International Standard Note:</strong> Once the term begins, changing the formula may require recalculated broadsheets for consistency. Ensure all sub-scores total exactly 100%.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Label className="text-base">Weight Distribution (%)</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="ca1" className="text-xs text-muted-foreground uppercase tracking-wider font-bold">C.A. 1</Label>
                          <Input 
                            id="ca1" 
                            type="number" 
                            value={formula.ca1_weight} 
                            onChange={(e) => setFormula({...formula, ca1_weight: parseInt(e.target.value) || 0})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ca2" className="text-xs text-muted-foreground uppercase tracking-wider font-bold">C.A. 2</Label>
                          <Input 
                            id="ca2" 
                            type="number" 
                            value={formula.ca2_weight} 
                            onChange={(e) => setFormula({...formula, ca2_weight: parseInt(e.target.value) || 0})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="exam" className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Terminal Exam</Label>
                          <Input 
                            id="exam" 
                            type="number" 
                            value={formula.exam_weight} 
                            onBlur={(e) => {
                              // Auto-calculate to total 100 if user wants?
                            }}
                            onChange={(e) => setFormula({...formula, exam_weight: parseInt(e.target.value) || 0})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pass" className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Pass Mark</Label>
                          <Input 
                            id="pass" 
                            type="number" 
                            className="border-primary/30"
                            value={formula.pass_mark}
                            onChange={(e) => setFormula({...formula, pass_mark: parseInt(e.target.value) || 0})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center items-center bg-muted/30 rounded-2xl p-8 border border-dashed border-border">
                    <div className="text-center space-y-2 mb-6">
                      <div className="text-5xl font-black text-primary">
                        {formula.ca1_weight + formula.ca2_weight + formula.exam_weight}%
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">Total Weight Calculation</p>
                    </div>
                    {formula.ca1_weight + formula.ca2_weight + formula.exam_weight !== 100 && (
                      <Badge variant="destructive" className="animate-pulse">Does not equal 100%</Badge>
                    )}
                  </div>
                </div>

                <div className="flex justify-end border-t pt-6">
                  <Button onClick={handleSaveFormula} disabled={saving} className="gap-2 px-8">
                    {saving ? "Saving..." : <><Save className="h-4 w-4" /> Save Formula</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rooms">
            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader className="border-b bg-muted/20">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Room Registry</CardTitle>
                    <CardDescription>Manage classrooms, laboratories, and halls.</CardDescription>
                  </div>
                  <Dialog open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" /> Register Room
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Facility</DialogTitle>
                        <DialogDescription>Define a new physical space for classes and exams.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Room Name/Number</Label>
                          <Input 
                            placeholder="e.g. Science Lab 1" 
                            value={newRoom.name}
                            onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Capacity (Students)</Label>
                            <Input 
                              type="number" 
                              value={newRoom.capacity}
                              onChange={(e) => setNewRoom({...newRoom, capacity: parseInt(e.target.value) || 0})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <Input 
                              placeholder="e.g. Laboratory" 
                              value={newRoom.type}
                              onChange={(e) => setNewRoom({...newRoom, type: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddRoomOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddRoom}>Confirm Registration</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Facility Name</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">
                          No rooms registered yet. Facility management is required for conflict-free timetables.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rooms.map((room) => (
                        <TableRow key={room.id} className="hover:bg-muted/30">
                          <TableCell className="font-semibold">{room.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-100">
                              {room.capacity} seats
                            </Badge>
                          </TableCell>
                          <TableCell>{room.type}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteRoom(room.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="text-xl">Academic Policies & Security</CardTitle>
                <CardDescription>Configure data entry locks and audit preferences.</CardDescription>
              </CardHeader>
              <CardContent className="pt-8 space-y-10">
                <div className="flex items-start justify-between p-6 rounded-2xl border bg-gradient-to-r from-orange-50/50 to-amber-50/50">
                  <div className="space-y-1">
                    <h4 className="font-bold text-orange-900 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" /> Immutable Record Policy
                    </h4>
                    <p className="text-sm text-orange-800/70 max-w-sm">
                      When enabled, teachers cannot modify grades or attendance once submitted. Changes require Principal override.
                    </p>
                  </div>
                  <div className="bg-orange-200/50 px-3 py-1 rounded-full text-orange-700 text-xs font-bold uppercase tracking-wider">
                    Always On (Enterprise Mode)
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <History className="h-4 w-4" /> Audit Configuration
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border bg-card flex items-center justify-between opacity-50 cursor-not-allowed">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">Log Grade Changes</p>
                        <p className="text-xs text-muted-foreground">Every edit is tracked with timestamps.</p>
                      </div>
                      <Badge>Enabled</Badge>
                    </div>
                    <div className="p-4 rounded-xl border bg-card flex items-center justify-between opacity-50 cursor-not-allowed">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">Log Attendance Edits</p>
                        <p className="text-xs text-muted-foreground">Historical records kept for compliance.</p>
                      </div>
                      <Badge>Enabled</Badge>
                    </div>
                  </div>
                </div>

                <Separator />
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground italic">
                  <Info className="h-4 w-4 shrink-0" />
                  Security settings are currently managed by the system administrator to maintain international compliance standards.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
