import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Car } from "lucide-react"
import mapboxgl from 'mapbox-gl'

interface PopupProps {
  map: mapboxgl.Map | null; // the Mapbox map instance
  coordinates: [number, number] // the currently active feature to display in the popup
  licensePlate: string; // optional license plate number
  photoUrl?: string; // optional URL for a photo of the vehicle
}


const Popup = ({ map, coordinates, licensePlate, photoUrl }: PopupProps) => {

  // a ref to hold the popup instance
  const popupRef = useRef<any>(null);
  // a ref for an element to hold the popup's content
  const contentRef = useRef(document.createElement("div"))
  const [imageError, setImageError] = useState(false)

  // instantiate the popup on mount, remove it on unmount
  useEffect(() => {
    if (!map) return

    // create a new popup instance, but do not set its location or content yet
    popupRef.current = new mapboxgl.Popup({
      closeButton: false, // show the close button
      closeOnClick: true,
      offset: 20
    })

    return () => {
      popupRef.current.remove()
    }
  }, [])


  // when activeFeature changes, set the popup's location and content, and add it to the map
  useEffect(() => {
    if (!coordinates) return

    popupRef.current
      .setLngLat(coordinates) // set its position using activeFeature's geometry
      .setHTML(contentRef.current.outerHTML) // use contentRef's `outerHTML` to set the content of the popup
      .addTo(map); // add the popup to the map


  }, [coordinates, map])

  // use a react portal to render the content to show in the popup, assigning it to contentRef
  return (
    <>{
      createPortal(

        <div className="space-y-4">
          {/* License Plate */}
          <div className="text-center">
            <div className="bg-yellow-400 text-black font-bold text-xl px-4 py-2 rounded border-2 border-black inline-block">
              {licensePlate}
            </div>
          </div>

          {/* Photo */}
          <div className="flex justify-center">
            {photoUrl && !imageError ? (
              <img
                src={photoUrl || "/placeholder.svg"}
                alt={`Vehicle ${licensePlate}`}
                className="max-w-full h-auto rounded-lg shadow-md max-h-64 object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Car className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No photo available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        ,
        contentRef.current
      )
    }</>
  )
}

export default Popup