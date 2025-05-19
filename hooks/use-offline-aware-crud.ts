"use client"

import { useState } from "react"
import { useOfflineStorage } from "./use-offline-storage"
import { useFirebaseConnection } from "./use-firebase-connection"
import { collection, doc, setDoc, deleteDoc, getDoc, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "./use-toast"

export function useOfflineAwareCrud(collectionName: string) {
  const [loading, setLoading] = useState(false)
  const { isConnected } = useFirebaseConnection()
  const { saveItem, deleteItem, getDocument, queryDocuments } = useOfflineStorage()

  // Create or update a document
  const saveDocument = async (data: any, id?: string) => {
    setLoading(true)
    try {
      // Ensure we have an ID
      const docId = id || doc(collection(db, collectionName)).id
      const documentData = { ...data, id: docId }

      if (isConnected) {
        // Online - save to Firestore first, then to IndexedDB
        await setDoc(doc(db, collectionName, docId), documentData)
        await saveItem(collectionName as any, documentData)

        toast({
          title: "Success",
          description: `${id ? "Updated" : "Created"} successfully`,
        })

        return { success: true, data: documentData }
      } else {
        // Offline - save to IndexedDB only
        const result = await saveItem(collectionName as any, documentData)

        if (result.success) {
          toast({
            title: "Success (Offline)",
            description: `${id ? "Updated" : "Created"} successfully. Will sync when online.`,
          })
          return { success: true, data: documentData, offline: true }
        } else {
          throw new Error("Failed to save offline")
        }
      }
    } catch (error) {
      console.error(`Error saving document:`, error)
      toast({
        title: "Error",
        description: `Failed to ${id ? "update" : "create"}. Please try again.`,
        variant: "destructive",
      })
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }

  // Delete a document
  const deleteDocument = async (id: string) => {
    setLoading(true)
    try {
      if (isConnected) {
        // Online - delete from Firestore first, then from IndexedDB
        await deleteDoc(doc(db, collectionName, id))
        await deleteItem(collectionName as any, id)

        toast({
          title: "Success",
          description: "Deleted successfully",
        })

        return { success: true }
      } else {
        // Offline - delete from IndexedDB only
        const result = await deleteItem(collectionName as any, id)

        if (result.success) {
          toast({
            title: "Success (Offline)",
            description: "Deleted successfully. Will sync when online.",
          })
          return { success: true, offline: true }
        } else {
          throw new Error("Failed to delete offline")
        }
      }
    } catch (error) {
      console.error(`Error deleting document:`, error)
      toast({
        title: "Error",
        description: "Failed to delete. Please try again.",
        variant: "destructive",
      })
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }

  // Get a document by ID
  const getDocumentById = async (id: string) => {
    setLoading(true)
    try {
      // Try to get from offline storage first
      const offlineResult = await getDocument(collectionName, id)

      if (offlineResult.success) {
        return { success: true, data: offlineResult.data, source: offlineResult.source }
      }

      // If offline result failed and we're online, try Firestore
      if (isConnected) {
        const docRef = doc(db, collectionName, id)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() }
          // Save to offline storage for future use
          await saveItem(collectionName as any, data, false)
          return { success: true, data, source: "server" }
        }
      }

      return { success: false, error: "Document not found" }
    } catch (error) {
      console.error(`Error getting document:`, error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }

  // Query documents
  const queryDocumentsWithFilters = async (filters?: { field: string; operator: string; value: any }[]) => {
    setLoading(true)
    try {
      // Try offline query first
      const offlineResult = await queryDocuments(collectionName, filters)

      // If we're online, also try to get from Firestore
      if (isConnected) {
        try {
          let queryRef = collection(db, collectionName)

          // Apply filters if provided
          if (filters && filters.length > 0) {
            filters.forEach((filter) => {
              queryRef = query(queryRef, where(filter.field, filter.operator as any, filter.value))
            })
          }

          const querySnapshot = await getDocs(queryRef)
          const documents = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

          // Save all documents to offline storage
          for (const doc of documents) {
            await saveItem(collectionName as any, doc, false)
          }

          return { success: true, data: documents, source: "server" }
        } catch (error) {
          console.error(`Error querying from server:`, error)
          // Fall back to offline result
          if (offlineResult.success) {
            return offlineResult
          }
          throw error
        }
      }

      // If offline, return offline result
      return offlineResult
    } catch (error) {
      console.error(`Error querying documents:`, error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    saveDocument,
    deleteDocument,
    getDocumentById,
    queryDocumentsWithFilters,
  }
}
