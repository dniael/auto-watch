import { useEffect, useRef } from "react"
import { Car, MapPin, Clock, User, Phone, AlertTriangle, Eye } from "lucide-react"
import mapboxgl from 'mapbox-gl'

interface PopupProps {
  map: mapboxgl.Map | null;
  coordinates: [number, number];
  reportData: any; // Full report data object
  onClose?: () => void; // Callback when popup is closed
}

const Popup = ({ map, coordinates, reportData, onClose }: PopupProps) => {
  const popupRef = useRef<any>(null);

  // Format time ago function
  const formatTimeAgo = (timestamp: any): string => {
    let timestampMs: number;
    
    if (timestamp?.seconds) {
      timestampMs = timestamp.seconds * 1000;
    } else if (timestamp?.toDate) {
      timestampMs = timestamp.toDate().getTime();
    } else if (timestamp instanceof Date) {
      timestampMs = timestamp.getTime();
    } else if (typeof timestamp === 'number') {
      timestampMs = timestamp;
    } else {
      return 'Unknown time';
    }
    
    const now = Date.now();
    const diffInMs = now - timestampMs;
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
    }
  };

  // Create popup content HTML
  const createPopupHTML = () => {
    const isTheft = reportData.reportType === 'theft';
    const badgeClass = isTheft ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700';
    const badgeIcon = isTheft ? '🚨' : '👁️';
    const badgeText = isTheft ? 'Theft Report' : 'Sighting Report';
    
    return `
      <div class="bg-white rounded-lg shadow-xl border border-gray-200" style="min-width: 350px; max-width: 400px; max-height: 70vh; display: flex; flex-direction: column; overflow: hidden;">
        <!-- Header with type badge and time -->
        <div class="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200" style="flex-shrink: 0;">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="px-2 py-1 rounded-full text-xs font-semibold ${badgeClass}">
                ${badgeIcon} ${badgeText}
              </div>
            </div>
            <div class="flex items-center gap-1 text-xs text-gray-500">
              ⏰ ${formatTimeAgo(reportData.info.date)}
            </div>
          </div>
        </div>

        <!-- Scrollable Content Area -->
        <div style="flex: 1; overflow-y: auto; max-height: calc(70vh - 140px);">
          <!-- License Plate -->
          <div class="px-4 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500">
            <div class="text-center">
              <div class="bg-black text-yellow-400 font-bold text-xl px-4 py-2 rounded border-2 border-black inline-block tracking-wider">
                ${reportData.info.licensePlate}
              </div>
            </div>
          </div>

          ${isTheft ? `
          <!-- Vehicle Details -->
          <div class="px-4 py-3 border-b border-gray-100">
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-gray-500">Make:</span>
                <span class="font-medium ml-1">${reportData.info.brand || 'N/A'}</span>
              </div>
              <div>
                <span class="text-gray-500">Model:</span>
                <span class="font-medium ml-1">${reportData.info.model || 'N/A'}</span>
              </div>
              <div>
                <span class="text-gray-500">Year:</span>
                <span class="font-medium ml-1">${reportData.info.year || 'N/A'}</span>
              </div>
              <div>
                <span class="text-gray-500">Color:</span>
                <span class="font-medium ml-1 capitalize">${reportData.info.color || 'N/A'}</span>
              </div>
              ${reportData.info.type ? `
              <div class="col-span-2">
                <span class="text-gray-500">Type:</span>
                <span class="font-medium ml-1 capitalize">${reportData.info.type}</span>
              </div>
              ` : ''}
            </div>
          </div>
          ` : ''}

          <!-- Photo -->
          <div class="px-4 py-3">
            ${reportData.info.photo ? `
              <div class="relative">
                <img
                  src="${reportData.info.photo}"
                  alt="Vehicle ${reportData.info.licensePlate}"
                  class="w-full h-48 object-cover rounded-lg shadow-md"
                  onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                />
                <div class="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  Photo
                </div>
              </div>
            ` : `
              <div class="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div class="text-center text-gray-500">
                  <div class="text-4xl mb-2">🚗</div>
                  <p class="text-sm font-medium">No photo available</p>
                </div>
              </div>
            `}
          </div>

          <!-- Location -->
          <div class="px-4 py-3 border-t border-gray-100">
            <div class="flex items-start gap-2">
              <div class="text-gray-400 mt-0.5 flex-shrink-0">📍</div>
              <div class="text-sm">
                <div class="font-medium text-gray-900">Location</div>
                <div class="text-gray-600">${reportData.location.address}</div>
              </div>
            </div>
          </div>

          ${(reportData.contact.name || reportData.contact.phone) ? `
          <!-- Contact Information -->
          <div class="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <div class="text-sm">
              <div class="font-medium text-gray-900 mb-2">Contact Information</div>
              ${reportData.contact.name ? `
                <div class="flex items-center gap-2 mb-1">
                  <div class="text-gray-400">👤</div>
                  <span class="text-gray-600">${reportData.contact.name}</span>
                </div>
              ` : ''}
              ${reportData.contact.phone ? `
                <div class="flex items-center gap-2">
                  <div class="text-gray-400">📞</div>
                  <span class="text-gray-600">${reportData.contact.phone}</span>
                </div>
              ` : ''}
            </div>
          </div>
          ` : ''}

          ${reportData.contact.context ? `
          <!-- Additional Details -->
          <div class="px-4 py-3 border-t border-gray-100">
            <div class="text-sm">
              <div class="font-medium text-gray-900 mb-1">Additional Details</div>
              <div class="text-gray-600 text-xs leading-relaxed">
                ${reportData.contact.context}
              </div>
            </div>
          </div>
          ` : ''}
        </div>

        ${isTheft ? `
        <!-- Action Button for Theft Reports -->
        <div class="px-4 py-3 border-t border-gray-100 bg-blue-50" style="flex-shrink: 0;">
          <button
            class="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            onclick="window.location.href='/sighting?vehicle=${encodeURIComponent(JSON.stringify({
              licensePlate: reportData.info.licensePlate,
              make: reportData.info.brand,
              model: reportData.info.model,
              color: reportData.info.color,
              year: reportData.info.year,
            }))}'"
          >
            👁️ Report a Sighting
          </button>
        </div>
        ` : ''}
      </div>
    `;
  };

  // Create and manage popup
  useEffect(() => {
    if (!map || !coordinates || !reportData) return;

    console.log("Creating popup for:", reportData.info?.licensePlate);

    // Add a small delay to ensure map is stable
    const timeoutId = setTimeout(() => {
      // Remove existing popup if it exists
      if (popupRef.current) {
        console.log("Removing existing popup");
        popupRef.current.remove();
      }

      // Create new popup
      popupRef.current = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: false,
        closeOnMove: false,
        offset: 25,
        maxWidth: '400px',
        className: 'custom-popup'
      });

      // Set popup content and position
      popupRef.current
        .setLngLat(coordinates)
        .setHTML(createPopupHTML())
        .addTo(map);

      // Add close event listener
      popupRef.current.on('close', () => {
        console.log("Popup closed by user");
        if (onClose) {
          onClose();
        }
      });

      // Prevent popup from being removed by map interactions
      popupRef.current.on('open', () => {
        console.log("Popup opened successfully");
      });
    }, 100); // Small delay to ensure map is stable

    return () => {
      clearTimeout(timeoutId);
      if (popupRef.current) {
        console.log("Cleaning up popup");
        popupRef.current.remove();
      }
    };
  }, [map, coordinates, reportData, onClose]);

  return null; // This component doesn't render anything directly
}

export default Popup