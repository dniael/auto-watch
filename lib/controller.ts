import { collection, getFirestore } from "firebase/firestore";
import { app } from "./firebase";

export const firestore = getFirestore(app);


// TheftMarker Collection
export const theftMarkersCollection = collection(firestore, "theftmarkers");