"use client"

import { useState, useEffect } from "react"
import { openDB, type IDBPDatabase } from "idb"

export function useOfflineStorage() {
  const [db, setDb] = useState<IDBPDatabase | null>(null)

  useEffect(() => {
    const initDB = async () => {
      const database = await openDB("school-management", 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains("students")) {
            db.createObjectStore("students", { keyPath: "id" })
          }
          // Add other stores as needed
        },
      })
      setDb(database)
    }
    initDB()
  }, [])

  return db
}
