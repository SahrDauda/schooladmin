"use client"

import { useState, useEffect, useRef } from "react"
import { openDB, type IDBPDatabase } from "idb"
import { toast } from "@/hooks/use-toast"
import { collection, doc, setDoc, deleteDoc, getDocs, query, where, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useFirebaseConnection } from "@/hooks/use-firebase-connection"

// Define the storage schema for all data types
export type OfflineStorageSchema = {
  students: any[]
  teachers: any[]
  classes: any[]
  subjects: any[]
  attendance: any[]
  teacher_attendance: any[]
  exams: any[]
  schooladmin: any[]
  pending_operations: {
    id: string
    operation: "create" | "update" | "delete"
    collection: string
    docId: string
    data?: any
    timestamp: number
  }[]
}

export function useOfflineStorage() {
  const [indexedDb, setIndexedDb] = useState<IDBPDatabase<OfflineStorageSchema> | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const { isConnected } = useFirebaseConnection()
  const initialized = useRef(false)
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(false)

  // Initialize the IndexedDB database
  useEffect(() => {
    if (initialized.current) return

    const initDB = async () => {
      try {
        setIsInitializing(true)
        const database = await openDB<OfflineStorageSchema>("school-management", 1, {
          upgrade(db) {
            // Create object stores for all data types if they don't exist
            const stores = [
              "students",
              "teachers",
              "classes",
              "subjects",
              "attendance",
              "teacher_attendance",
              "exams",
              "schooladmin",
              "pending_operations",
            ]

            stores.forEach((store) => {
              if (!db.objectStoreNames.contains(store)) {
                db.createObjectStore(store, { keyPath: "id" })
              }
            })
          },
        })

        setIndexedDb(database)
        initialized.current = true
        setIsInitializing(false)
      } catch (error) {
        console.error("Error initializing IndexedDB:", error)
        toast({
          title: "Error",
          description: "Failed to initialize offline storage",
          variant: "destructive",
        })
        setIsInitializing(false)
      }
    }

    initDB()

    return () => {
      if (indexedDb) {
        indexedDb.close()
      }
    }
  }, [indexedDb])

  // Sync when connection is restored
  useEffect(() => {
    if (isConnected && indexedDb && !isInitializing) {
      const syncOnReconnect = async () => {
        const pendingOps = await indexedDb.getAll("pending_operations")
        if (pendingOps.length > 0) {
          toast({
            title: "Syncing",
            description: `Syncing ${pendingOps.length} pending changes...`,
          })
          await syncPendingOperationsWithStatus()
        }
      }

      syncOnReconnect()
    }
  }, [isConnected, indexedDb, isInitializing])

  // Get all items from a collection
  const getAll = async (collectionName: keyof OfflineStorageSchema) => {
    if (!indexedDb) return []

    try {
      return await indexedDb.getAll(collectionName)
    } catch (error) {
      console.error(`Error getting all items from ${collectionName}:`, error)
      return []
    }
  }

  // Get a single item by ID
  const getById = async (collectionName: keyof OfflineStorageSchema, id: string) => {
    if (!indexedDb) return null

    try {
      return await indexedDb.get(collectionName, id)
    } catch (error) {
      console.error(`Error getting item from ${collectionName}:`, error)
      return null
    }
  }

  // Add or update an item in IndexedDB and queue for sync
  const saveItem = async (collectionName: keyof OfflineStorageSchema, data: any, syncToServer = true) => {
    if (!indexedDb) return { success: false, error: "Database not initialized" }

    try {
      // Ensure the data has an ID
      if (!data.id) {
        data.id = doc(collection(db, collectionName.toString())).id
      }

      // Save to IndexedDB
      await indexedDb.put(collectionName, data)

      // If online and sync is requested, sync immediately
      if (isConnected && syncToServer) {
        try {
          await setDoc(doc(db, collectionName.toString(), data.id), data)
          return { success: true, data }
        } catch (error) {
          console.error(`Error syncing to server:`, error)
          // If immediate sync fails, queue for later
          await addPendingOperation("update", collectionName.toString(), data.id, data)
          return { success: true, data, synced: false }
        }
      }
      // If offline, queue for later sync
      else if (syncToServer) {
        await addPendingOperation("update", collectionName.toString(), data.id, data)
        return { success: true, data, synced: false }
      }

      return { success: true, data }
    } catch (error) {
      console.error(`Error saving item to ${collectionName}:`, error)
      return { success: false, error }
    }
  }

  // Delete an item from IndexedDB and queue for sync
  const deleteItem = async (collectionName: keyof OfflineStorageSchema, id: string, syncToServer = true) => {
    if (!indexedDb) return { success: false, error: "Database not initialized" }

    try {
      // Delete from IndexedDB
      await indexedDb.delete(collectionName, id)

      // If online and sync is requested, sync immediately
      if (isConnected && syncToServer) {
        try {
          await deleteDoc(doc(db, collectionName.toString(), id))
          return { success: true }
        } catch (error) {
          console.error(`Error syncing deletion to server:`, error)
          // If immediate sync fails, queue for later
          await addPendingOperation("delete", collectionName.toString(), id)
          return { success: true, synced: false }
        }
      }
      // If offline, queue for later sync
      else if (syncToServer) {
        await addPendingOperation("delete", collectionName.toString(), id)
        return { success: true, synced: false }
      }

      return { success: true }
    } catch (error) {
      console.error(`Error deleting item from ${collectionName}:`, error)
      return { success: false, error }
    }
  }

  // Add a pending operation to the queue
  const addPendingOperation = async (
    operation: "create" | "update" | "delete",
    collectionName: string,
    docId: string,
    data?: any,
  ) => {
    if (!indexedDb) return false

    try {
      const pendingOp = {
        id: `${collectionName}_${docId}_${Date.now()}`,
        operation,
        collection: collectionName,
        docId,
        data,
        timestamp: Date.now(),
      }

      await indexedDb.add("pending_operations", pendingOp)
      return true
    } catch (error) {
      console.error("Error adding pending operation:", error)
      return false
    }
  }

  // Sync all pending operations to the server
  const syncPendingOperations = async () => {
    if (!indexedDb || !isConnected) return { success: false, error: "Cannot sync while offline" }

    setIsSyncing(true)

    try {
      const pendingOps = await indexedDb.getAll("pending_operations")

      if (pendingOps.length === 0) {
        setIsSyncing(false)
        return { success: true, message: "No pending operations" }
      }

      // Sort by timestamp to maintain order
      pendingOps.sort((a, b) => a.timestamp - b.timestamp)

      let successCount = 0
      let errorCount = 0

      for (const op of pendingOps) {
        try {
          if (op.operation === "create" || op.operation === "update") {
            await setDoc(doc(db, op.collection, op.docId), op.data)
          } else if (op.operation === "delete") {
            await deleteDoc(doc(db, op.collection, op.docId))
          }

          // Remove from pending operations
          await indexedDb.delete("pending_operations", op.id)
          successCount++
        } catch (error) {
          console.error(`Error processing operation ${op.id}:`, error)
          errorCount++
        }
      }

      setLastSyncTime(new Date())

      if (successCount > 0) {
        toast({
          title: "Sync Complete",
          description: `Successfully synced ${successCount} operations${errorCount > 0 ? `, ${errorCount} failed` : ""}`,
        })
      }

      return {
        success: true,
        syncedCount: successCount,
        errorCount,
        message: `Synced ${successCount} operations, ${errorCount} failed`,
      }
    } catch (error) {
      console.error("Error syncing pending operations:", error)
      toast({
        title: "Sync Failed",
        description: "Failed to sync some operations. Will retry later.",
        variant: "destructive",
      })
      return { success: false, error }
    } finally {
      setIsSyncing(false)
    }
  }

  // Sync all pending operations to the server with status tracking
  const syncPendingOperationsWithStatus = async () => {
    if (isSyncing || isBackgroundSyncing) return { success: false, error: "Sync already in progress" }

    setIsBackgroundSyncing(true)
    try {
      const result = await syncPendingOperations()
      return result
    } finally {
      setIsBackgroundSyncing(false)
    }
  }

  // Download all data for offline use
  const downloadAllData = async (schoolId: string) => {
    if (!indexedDb) return { success: false, error: "Database not initialized" }
    if (!isConnected) return { success: false, error: "Cannot download data while offline" }

    setIsSyncing(true)

    try {
      toast({
        title: "Downloading Data",
        description: "Preparing data for offline use...",
      })

      // Collections to download
      const collections = [
        "students",
        "teachers",
        "classes",
        "subjects",
        "attendance",
        "teacher_attendance",
        "exams",
        "schooladmin",
      ]

      let totalDocuments = 0

      // Download each collection
      for (const collectionName of collections) {
        let queryRef = collection(db, collectionName)

        // Apply school filter for all collections except schooladmin
        if (collectionName !== "schooladmin" && schoolId) {
          queryRef = query(queryRef, where("school_id", "==", schoolId))
        }

        const snapshot = await getDocs(queryRef)

        // Clear existing data
        const tx = indexedDb.transaction(collectionName, "readwrite")
        const store = tx.objectStore(collectionName)
        await store.clear()

        // Add all documents
        for (const doc of snapshot.docs) {
          const data = { id: doc.id, ...doc.data() }
          await store.put(data)
          totalDocuments++
        }

        await tx.done
      }

      setLastSyncTime(new Date())

      toast({
        title: "Download Complete",
        description: `Downloaded ${totalDocuments} items for offline use`,
      })

      return { success: true, count: totalDocuments }
    } catch (error) {
      console.error("Error downloading data:", error)
      toast({
        title: "Download Failed",
        description: "Failed to download all data for offline use",
        variant: "destructive",
      })
      return { success: false, error }
    } finally {
      setIsSyncing(false)
    }
  }

  // Get a document with offline support
  const getDocument = async (collectionName: string, id: string) => {
    if (!indexedDb) return { success: false, error: "Database not initialized" }

    try {
      // Try to get from IndexedDB first
      const localDoc = await indexedDb.get(collectionName as keyof OfflineStorageSchema, id)

      // If online, try to get from Firestore and update local copy
      if (isConnected) {
        try {
          const remoteDocRef = doc(db, collectionName, id)
          const remoteDoc = await getDoc(remoteDocRef)

          if (remoteDoc.exists()) {
            const data = { id: remoteDoc.id, ...remoteDoc.data() }

            // Update local copy if different
            if (JSON.stringify(localDoc) !== JSON.stringify(data)) {
              await indexedDb.put(collectionName as keyof OfflineStorageSchema, data)
              return { success: true, data, source: "server" }
            }
          } else if (localDoc) {
            // Document exists locally but not on server
            return { success: true, data: localDoc, source: "local" }
          } else {
            // Document doesn't exist anywhere
            return { success: false, error: "Document not found" }
          }
        } catch (error) {
          console.error(`Error fetching document from server:`, error)
          // Fall back to local copy if server fetch fails
          if (localDoc) {
            return { success: true, data: localDoc, source: "local" }
          }
          return { success: false, error }
        }
      }

      // If offline or server fetch failed, return local copy
      if (localDoc) {
        return { success: true, data: localDoc, source: "local" }
      }

      return { success: false, error: "Document not found" }
    } catch (error) {
      console.error(`Error getting document:`, error)
      return { success: false, error }
    }
  }

  // Query documents with offline support
  const queryDocuments = async (
    collectionName: string,
    filters?: { field: string; operator: string; value: any }[],
  ) => {
    if (!indexedDb) return { success: false, error: "Database not initialized" }

    try {
      // Get all documents from IndexedDB
      const allDocs = await indexedDb.getAll(collectionName as keyof OfflineStorageSchema)

      // Apply filters if provided
      let filteredDocs = allDocs
      if (filters && filters.length > 0) {
        filteredDocs = allDocs.filter((doc) => {
          return filters.every((filter) => {
            const { field, operator, value } = filter

            switch (operator) {
              case "==":
                return doc[field] === value
              case "!=":
                return doc[field] !== value
              case ">":
                return doc[field] > value
              case ">=":
                return doc[field] >= value
              case "<":
                return doc[field] < value
              case "<=":
                return doc[field] <= value
              case "array-contains":
                return Array.isArray(doc[field]) && doc[field].includes(value)
              default:
                return true
            }
          })
        })
      }

      return { success: true, data: filteredDocs, source: "local" }
    } catch (error) {
      console.error(`Error querying documents:`, error)
      return { success: false, error }
    }
  }

  return {
    db: indexedDb,
    isInitializing,
    isSyncing,
    lastSyncTime,
    getAll,
    getById,
    saveItem,
    deleteItem,
    syncPendingOperations,
    downloadAllData,
    getDocument,
    queryDocuments,
    isBackgroundSyncing,
    syncPendingOperationsWithStatus,
  }
}
