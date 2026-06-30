import { SchoolInfo } from "./school-utils";

export function getCurrentSchoolInfoSync(): SchoolInfo {
  // This is a simplified version just for initial state
  // In a real app, you might parse cookies synchronously or rely on React Context
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("schooladmin_auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          school_id: parsed.school_id || "",
          schoolName: parsed.schoolname || "",
          stage: parsed.stage || ""
        };
      }
    }
  } catch (e) {
    // Ignore
  }
  return { school_id: "", schoolName: "" };
}
