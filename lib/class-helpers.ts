import { ClassWithDetails } from "./class-utils";

// Stage-specific level options
export const getLevelOptions = (stage: string, includeAll: boolean = false) => {
    const s = stage ? stage.trim().toLowerCase() : "";
    const all = includeAll ? ["All"] : [];
    
    if (s.includes("primary") || s.includes("prep")) {
      return [...all, "Prep 1", "Prep 2", "Prep 3", "Prep 4", "Prep 5", "Prep 6"];
    } else if (s.includes("junior")) {
      return [...all, "JSS 1", "JSS 2", "JSS 3"];
    } else if (s.includes("senior")) {
      return [...all, "SSS 1", "SSS 2", "SSS 3"];
    } else {
      // Return all levels as fallback so the admin is never locked out of adding classes/students
      return [
        ...all,
        "Prep 1", "Prep 2", "Prep 3", "Prep 4", "Prep 5", "Prep 6",
        "JSS 1", "JSS 2", "JSS 3",
        "SSS 1", "SSS 2", "SSS 3"
      ];
    }
}

// Dashboard metrics
export const getClassMetrics = (classes: ClassWithDetails[]) => {
    const totalClasses = classes.length
    const totalStudents = classes.reduce((sum, cls) => sum + (cls.students_count || 0), 0)
    const totalCapacity = classes.reduce((sum, cls) => sum + (cls.capacity || 0), 0)
    const averageOccupancy = totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0
    const fullClasses = classes.filter(cls => (cls.students_count || 0) >= cls.capacity).length
    const emptyClasses = classes.filter(cls => (cls.students_count || 0) === 0).length
  
    return {
      totalClasses,
      totalStudents,
      totalCapacity,
      averageOccupancy,
      fullClasses,
      emptyClasses
    }
}
