// ============================================
// LocationPicker — interactive Mapbox map with draggable pin
// ============================================

import { useState, useCallback, useRef, useEffect } from "react"
// Modified by Agent A for: react-map-gl v8 requires subpath import
import Map, { Marker, type MapRef } from "react-map-gl/mapbox"
import { MapPin, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/hooks/useDebounce"
import "mapbox-gl/dist/mapbox-gl.css"

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? ""

interface LocationValue {
  lat: number
  lng: number
  locationText?: string
}

interface LocationPickerProps {
  /** Current selected location */
  value?: LocationValue
  /** Callback when the user picks a location */
  onChange: (location: LocationValue) => void
  /** Default center if no value is set (lat, lng) */
  defaultCenter?: { lat: number; lng: number }
  /** Custom height for the map */
  height?: string
  /** Custom class name */
  className?: string
}

interface GeocodingResult {
  id: string
  place_name: string
  center: [number, number] // [lng, lat]
}

/**
 * Interactive location picker with a draggable marker and geocoding search.
 * Returns { lat, lng, locationText } on change.
 */
export function LocationPicker({
  value,
  onChange,
  defaultCenter = { lat: 19.076, lng: 72.8777 }, // Mumbai
  height = "300px",
  className,
}: LocationPickerProps) {
  const mapRef = useRef<MapRef>(null)
  const [searchText, setSearchText] = useState("")
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debouncedSearch = useDebounce(searchText, 300)

  const currentLat = value?.lat ?? defaultCenter.lat
  const currentLng = value?.lng ?? defaultCenter.lng

  // Geocoding search
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 3) {
      setSuggestions([])
      return
    }

    const controller = new AbortController()
    const fetchSuggestions = async () => {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          debouncedSearch
        )}.json?access_token=${MAPBOX_TOKEN}&country=in&limit=5`
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) return
        const data = (await res.json()) as { features: GeocodingResult[] }
        setSuggestions(data.features)
        setShowSuggestions(true)
      } catch {
        // Aborted or failed — ignore
      }
    }
    void fetchSuggestions()
    return () => controller.abort()
  }, [debouncedSearch])

  /** Handle marker drag end */
  const handleMarkerDragEnd = useCallback(
    (event: { lngLat: { lng: number; lat: number } }) => {
      onChange({
        lat: event.lngLat.lat,
        lng: event.lngLat.lng,
        locationText: value?.locationText,
      })
    },
    [onChange, value?.locationText]
  )

  /** Handle map click */
  const handleMapClick = useCallback(
    (event: { lngLat: { lng: number; lat: number } }) => {
      onChange({
        lat: event.lngLat.lat,
        lng: event.lngLat.lng,
        locationText: value?.locationText,
      })
    },
    [onChange, value?.locationText]
  )

  /** Select a geocoding suggestion */
  const handleSelectSuggestion = useCallback(
    (result: GeocodingResult) => {
      const [lng, lat] = result.center
      onChange({ lat, lng, locationText: result.place_name })
      setSearchText(result.place_name)
      setShowSuggestions(false)
      mapRef.current?.flyTo({ center: [lng, lat], zoom: 15, duration: 1200 })
    },
    [onChange]
  )

  return (
    <div className={className}>
      {/* Search bar */}
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="Search for a location..."
          className="pl-9 pr-8"
        />
        {searchText && (
          <button
            type="button"
            onClick={() => {
              setSearchText("")
              setSuggestions([])
              setShowSuggestions(false)
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => handleSelectSuggestion(result)}
                className="flex items-start gap-2 w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
              >
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-foreground">{result.place_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-border" style={{ height }}>
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: currentLng,
            latitude: currentLat,
            zoom: 14,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          onClick={handleMapClick}
        >
          <Marker
            longitude={currentLng}
            latitude={currentLat}
            draggable
            onDragEnd={handleMarkerDragEnd}
          >
            <MapPin className="h-8 w-8 text-primary -translate-y-4 drop-shadow-lg" />
          </Marker>
        </Map>
      </div>

      {/* Current location text */}
      {value?.locationText && (
        <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {value.locationText}
        </p>
      )}
    </div>
  )
}
