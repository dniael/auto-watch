import { addDoc, collection, getFirestore } from "firebase/firestore";
import { app } from "./firebase";
import { AddTheftType } from "./types";

export const firestore = getFirestore(app);


// TheftMarker Collection
export const theftCollection = collection(firestore, "theftmarkers");

// ADD new theft report info
export const addTheftMarker = async (theftReportData: AddTheftType) => {
    const newTheftMarker = await addDoc(theftCollection, {...theftReportData})
    console.log(`new theft marker made at ${newTheftMarker.path}`)
}