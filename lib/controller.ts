import { addDoc, collection, getFirestore } from "firebase/firestore";
import { app } from "./firebase";
import { AddTheftType, AddSightingType } from "./types";

export const firestore = getFirestore(app);


// TheftMarker Collection
export const theftCollection = collection(firestore, "theftmarkers");

// SightingMarker Collection
export const sightingCollection = collection(firestore, "sightingmarkers");

// ADD new theft report info
export const addTheftMarker = async (theftReportData: AddTheftType) => {
    const newTheftMarker = await addDoc(theftCollection, {...theftReportData})
    console.log(`new theft marker made at ${newTheftMarker.path}`)
}

// ADD new sighting report info
export const addSightingMarker = async (sightingReportData: AddSightingType) => {
    const newSightingMarker = await addDoc(sightingCollection, {...sightingReportData})
    console.log(`new sighting marker made at ${newSightingMarker.path}`)
}