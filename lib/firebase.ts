import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyCVjMvf9duP0z-q1voq3fMz7Ie9DVfz5qY",
  authDomain: "skultek-547c6.firebaseapp.com",
  projectId: "skultek-547c6",
  storageBucket: "skultek-547c6.firebasestorage.app",
  messagingSenderId: "551170589387",
  appId: "1:551170589387:web:500955979a83258c7f514e",
  measurementId: "G-D2TZHQBBGG"
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const db = getFirestore(app)
const auth = getAuth(app)

export { db, auth }
