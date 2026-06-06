const fs = require('fs');

let content = fs.readFileSync('app/subjects/page.tsx', 'utf8');

// 1. Update the Assign Dialog JSX
const oldAssignDialog = `          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Teacher</DialogTitle>
              <DialogDescription>
                Assign a teacher to {selectedSubject?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Teacher</Label>
                <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.firstname} {teacher.lastname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAssignTeacherDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAssignTeacher} disabled={!selectedTeacher}>
                  Assign Teacher
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>`;

const newAssignDialog = `          <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Assign Teacher(s)</DialogTitle>
              <DialogDescription>
                Assign a teacher to {selectedSubject?.name} for each class in its level ({selectedSubject?.level}).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {(() => {
                // Find classes that belong to this subject's level
                // Assuming classes table has 'name' or we can match level. 
                // For simplicity, we just filter classes where name starts with the level, or just list all classes if level is All.
                const subjectLevel = selectedSubject?.level || "All";
                const relevantClasses = subjectLevel === "All" 
                  ? classes 
                  : classes.filter(c => c.name.startsWith(subjectLevel));
                
                if (relevantClasses.length === 0) {
                  return <div className="text-muted-foreground p-4 text-center">No classes found for this level.</div>;
                }

                return (
                  <div className="space-y-4">
                    {relevantClasses.map(cls => (
                      <div key={cls.id} className="grid grid-cols-[1fr_2fr] gap-4 items-center">
                        <Label>{cls.name} {cls.section ? \`(\${cls.section})\` : ''}</Label>
                        <Select 
                          value={classAssignments[cls.id] || "unassigned"} 
                          onValueChange={(val) => setClassAssignments(prev => ({ ...prev, [cls.id]: val === "unassigned" ? "" : val }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a teacher" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">-- Unassigned --</SelectItem>
                            {teachers.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id}>
                                {teacher.firstname} {teacher.lastname}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                );
              })()}
              
              <DialogFooter className="mt-4 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsAssignTeacherDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAssignTeacher}>
                  Save Assignments
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>`;

content = content.replace(oldAssignDialog, newAssignDialog);

// 2. Update TableCell for "Assigned Teacher"
const oldTableCell = `                          <TableCell>
                            {subject.assigned_teacher_name ? (
                              <div className="flex items-center gap-2">
                                <span>{subject.assigned_teacher_name}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive"
                                  onClick={() => handleUnassignTeacher(subject)}
                                  title="Unassign Teacher"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenAssignTeacherDialog(subject)}
                              >
                                Assign
                              </Button>
                            )}
                          </TableCell>`;

const newTableCell = `                          <TableCell>
                            {subject.class_subjects && subject.class_subjects.length > 0 ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm">
                                  {subject.class_subjects.length} class{subject.class_subjects.length !== 1 ? 'es' : ''} assigned
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-primary"
                                  onClick={() => handleOpenAssignTeacherDialog(subject)}
                                  title="Edit Assignments"
                                >
                                  <Pencil className="h-3 w-3 mr-1" /> Edit
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenAssignTeacherDialog(subject)}
                              >
                                Assign
                              </Button>
                            )}
                          </TableCell>`;

content = content.replace(oldTableCell, newTableCell);

fs.writeFileSync('app/subjects/page.tsx', content);
