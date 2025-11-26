"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { Loader2, MessageSquare } from "lucide-react"

interface GradeCommentDialogProps {
  isOpen: boolean
  onClose: () => void
  grade: {
    id: string
    score: number
    term: string
    subject_name: string
    student_name: string
    comments?: string
  } | null
  onCommentUpdated: (gradeId: string, newComment: string) => void
}

export function GradeCommentDialog({ isOpen, onClose, grade, onCommentUpdated }: GradeCommentDialogProps) {
  const [comment, setComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Initialize comment when grade changes
  useEffect(() => {
    if (grade) {
      setComment(grade.comments || "")
    }
  }, [grade])

  const handleSave = async () => {
    if (!grade) return

    setIsLoading(true)
    try {
      // Update the grade document in Supabase
      const { error } = await supabase
        .from('grades')
        .update({ comments: comment.trim() })
        .eq('id', grade.id)

      if (error) throw error

      // Update local state
      onCommentUpdated(grade.id, comment.trim())

      toast({
        title: "Success",
        description: "Comment updated successfully",
      })

      onClose()
    } catch (error) {
      console.error("Error updating comment:", error)
      toast({
        title: "Error",
        description: "Failed to update comment",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getGradeLetter = (score: number) => {
    if (score >= 90) return "A+"
    if (score >= 80) return "A"
    if (score >= 70) return "B"
    if (score >= 60) return "C"
    if (score >= 50) return "D"
    return "F"
  }

  if (!grade) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Add/Edit Comment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Grade Information */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Student:</span>
              <span>{grade.student_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Subject:</span>
              <span>{grade.subject_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Term:</span>
              <span>{grade.term}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Score:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold">{grade.score}%</span>
                <Badge variant={grade.score >= 70 ? "default" : grade.score >= 50 ? "secondary" : "destructive"}>
                  {getGradeLetter(grade.score)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Comment Input */}
          <div className="space-y-2">
            <Label htmlFor="comment">Teacher's Comment</Label>
            <Textarea
              id="comment"
              placeholder="Enter your comment about this grade..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="text-xs text-muted-foreground">{comment.length}/500 characters</div>
          </div>

          {/* Predefined Comments */}
          <div className="space-y-2">
            <Label>Quick Comments</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                "Excellent work!",
                "Good effort",
                "Needs improvement",
                "Well done",
                "Keep it up",
                "More practice needed",
                "Outstanding performance",
                "Satisfactory",
              ].map((quickComment) => (
                <Button
                  key={quickComment}
                  variant="outline"
                  size="sm"
                  onClick={() => setComment(quickComment)}
                  className="text-xs"
                >
                  {quickComment}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Comment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
