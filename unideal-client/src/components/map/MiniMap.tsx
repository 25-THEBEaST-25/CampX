// ============================================
// MiniMap — static display map with a pin marker
// ============================================

// Modified by Agent A for: react-map-gl v8 requires subpath import
import Map, { Marker } from "react-map-gl/mapbox"
import { MapPin } from "lucide-react"
import "mapbox-gl/dist/mapbox-gl.css"

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? ""

interface MiniMapProps {
  /** Latitude of the marker */
  lat: number
  /** Longitude of the marker */
  lng: number
  /** Zoom level (default: 14) */
  zoom?: number
  /** Map height (default: "200px") */
  height?: string
  /** Custom class name */
  className?: string
  /** Location label shown below the map */
  label?: string
}

/**
 * Non-interactive mini map that displays a pin at a given coordinate.
 * Used on item detail pages to show pickup location.
 */
export function MiniMap({
  lat,
  lng,
  zoom = 14,
  height = "200px",
  className,
  label,
}: MiniMapProps) {
  return (
    <div className={className}>
      <div className="rounded-xl overflow-hidden border border-border" style={{ height }}>
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: lng,
            latitude: lat,
            zoom,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          interactive={false}
          attributionControl={false}
        >
          <Marker longitude={lng} latitude={lat}>
            <MapPin className="h-6 w-6 text-primary -translate-y-3 drop-shadow-lg" />
          </Marker>
        </Map>
      </div>
      {label && (
        <p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {label}
        </p>
      )}
    </div>
  )
}
