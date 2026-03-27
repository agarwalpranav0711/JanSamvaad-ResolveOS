'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { mockComplaints, type MockComplaint, type ComplaintSeverity } from '@/lib/mock-complaints'

type LeafletNS = any
type MarkerClusterNS = any

const severityLabels: Array<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'> = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
const severityColor: Record<ComplaintSeverity, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#22C55E'
}
const severityRank: Record<ComplaintSeverity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
}

function complaintAgeInDays(createdAt: string): number {
  const diff = Date.now() - new Date(createdAt).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

function markerOpacity(createdAt: string): number {
  const days = complaintAgeInDays(createdAt)
  if (days > 30) return 0.25
  if (days > 7) return 0.5
  return 1
}

function isFresh(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000
}

function normalizeSeverity(value: string): ComplaintSeverity {
  const lower = value.toLowerCase()
  if (lower === 'critical' || lower === 'high' || lower === 'medium' || lower === 'low') return lower
  return 'medium'
}

export default function GISMapClient() {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerLayerRef = useRef<any>(null)
  const heatLayerRef = useRef<any>(null)
  const wardLayerRef = useRef<any>(null)
  const leafletRef = useRef<LeafletNS | null>(null)
  const markerClusterRef = useRef<MarkerClusterNS | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL')
  const [heatmapOn, setHeatmapOn] = useState(false)

  const filteredComplaints = useMemo(() => {
    if (filter === 'ALL') return mockComplaints
    return mockComplaints.filter((item) => item.severity.toUpperCase() === filter)
  }, [filter])

  useEffect(() => {
    const links = [
      'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
      'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css',
      'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css'
    ]
    const appended: HTMLLinkElement[] = []
    links.forEach((href) => {
      if (document.querySelector(`link[href="${href}"]`)) return
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      document.head.appendChild(link)
      appended.push(link)
    })
    return () => {
      appended.forEach((link) => document.head.removeChild(link))
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadDeps() {
      const L = await import('leaflet')
      await import('leaflet.markercluster')
      await import('leaflet.heat')
      if (cancelled) return
      leafletRef.current = L
      markerClusterRef.current = L
      setLoaded(true)
    }
    loadDeps()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!loaded || !mapRef.current || mapInstanceRef.current || !leafletRef.current) return
    const L = leafletRef.current
    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false
    }).setView([28.6139, 77.209], 11)

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18
    }).addTo(map)

    mapInstanceRef.current = map
    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [loaded])

  useEffect(() => {
    if (!loaded || !mapInstanceRef.current || !leafletRef.current) return
    const L = leafletRef.current
    let cancelled = false
    async function loadBoundaries() {
      try {
        const response = await fetch('https://raw.githubusercontent.com/datameet/maps/master/Districts/Delhi.geojson')
        if (!response.ok) return
        const geojson = await response.json()
        if (cancelled || !mapInstanceRef.current) return

        if (wardLayerRef.current) {
          mapInstanceRef.current.removeLayer(wardLayerRef.current)
        }

        const layer = L.geoJSON(geojson, {
          style: {
            color: '#60A5FA',
            weight: 1,
            opacity: 0.55,
            fillOpacity: 0
          },
          onEachFeature: (feature: any, featureLayer: any) => {
            const wardName =
              feature?.properties?.ward ||
              feature?.properties?.WARD ||
              feature?.properties?.district ||
              feature?.properties?.DISTRICT ||
              feature?.properties?.name ||
              'Delhi Ward'
            featureLayer.bindTooltip(String(wardName), { sticky: true, direction: 'top', className: 'ward-tooltip' })
            featureLayer.on('mouseover', () => {
              featureLayer.setStyle({ color: '#F8FAFC', weight: 2, opacity: 0.95 })
            })
            featureLayer.on('mouseout', () => {
              layer.resetStyle(featureLayer)
            })
          }
        })
        layer.addTo(mapInstanceRef.current)
        wardLayerRef.current = layer
      } catch (_) {
      }
    }
    loadBoundaries()
    return () => {
      cancelled = true
    }
  }, [loaded])

  useEffect(() => {
    if (!loaded || !mapInstanceRef.current || !leafletRef.current || !markerClusterRef.current) return
    const map = mapInstanceRef.current
    const L = leafletRef.current

    if (markerLayerRef.current) {
      map.removeLayer(markerLayerRef.current)
      markerLayerRef.current = null
    }
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current)
      heatLayerRef.current = null
    }

    if (heatmapOn) {
      const points = filteredComplaints.map((item) => {
        const sevWeight = item.severity === 'critical' ? 1 : item.severity === 'high' ? 0.85 : item.severity === 'medium' ? 0.65 : 0.45
        return [item.lat, item.lng, sevWeight]
      })
      heatLayerRef.current = (L as any).heatLayer(points, {
        radius: 28,
        blur: 22,
        minOpacity: 0.35,
        gradient: {
          0.2: '#22C55E',
          0.45: '#EAB308',
          0.7: '#F97316',
          1.0: '#EF4444'
        }
      }).addTo(map)
      return
    }

    const clusterGroup = (L as any).markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 42,
      iconCreateFunction: (cluster: any) => {
        const markers = cluster.getAllChildMarkers()
        const maxRank = markers.reduce((rank: number, marker: any) => Math.max(rank, marker.options.severityRank || 1), 1)
        const color = maxRank >= 4 ? '#EF4444' : maxRank === 3 ? '#F97316' : maxRank === 2 ? '#EAB308' : '#22C55E'
        return L.divIcon({
          html: `<div class="cluster-pill" style="background:${color}">${cluster.getChildCount()}</div>`,
          className: 'custom-cluster-icon',
          iconSize: [40, 40]
        })
      }
    })

    filteredComplaints.forEach((item: MockComplaint) => {
      const sev = normalizeSeverity(item.severity)
      const color = severityColor[sev]
      const opacity = markerOpacity(item.createdAt)
      const ageDays = complaintAgeInDays(item.createdAt)
      const fresh = isFresh(item.createdAt)
      const marker = L.marker([item.lat, item.lng], {
        severityRank: severityRank[sev],
        icon: L.divIcon({
          className: 'complaint-pin-wrap',
          html: `<div class="complaint-pin ${fresh ? 'fresh' : ''}" style="--pin-color:${color};--pin-opacity:${opacity};"></div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        })
      })
      marker.bindPopup(
        `<div style="min-width:220px;font-family:Inter,sans-serif;">
          <div style="font-weight:700;color:#fff;margin-bottom:6px;">${item.title}</div>
          <div style="font-size:12px;color:#CBD5E1;">Ward: ${item.ward}</div>
          <div style="font-size:12px;color:${color};text-transform:uppercase;">Severity: ${sev}</div>
          <div style="font-size:12px;color:#94A3B8;">Age: ${ageDays} day${ageDays === 1 ? '' : 's'}</div>
        </div>`,
        { className: 'leaflet-dark-popup' }
      )
      clusterGroup.addLayer(marker)
    })

    clusterGroup.addTo(map)
    markerLayerRef.current = clusterGroup
  }, [filteredComplaints, heatmapOn, loaded])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">GIS Complaint Map</h2>
          <p className="text-xs text-slate-400">Live complaint pins across Delhi wards</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {severityLabels.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setFilter(label)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === label
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-400/40'
                  : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
              }`}
            >
              {label === 'ALL' ? `ALL (${mockComplaints.length})` : label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setHeatmapOn((v) => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              heatmapOn
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
                : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
            }`}
          >
            Heatmap
          </button>
        </div>
      </div>

      <div className="relative rounded-2xl border border-white/10 overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
        {!loaded ? (
          <div className="absolute inset-0 bg-[#112240] flex items-center justify-center z-10">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-300">Loading map...</p>
            </div>
          </div>
        ) : null}
        <div ref={mapRef} className="w-full h-full" />

        <div className="absolute bottom-4 right-4 z-[1000] bg-slate-900/90 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
          <p className="text-xs font-semibold text-white mb-2">Legend</p>
          {Object.entries(severityColor).map(([label, color]) => (
            <div key={label} className="flex items-center gap-2 text-xs text-slate-300 mb-1">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="uppercase">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .leaflet-dark-popup .leaflet-popup-content-wrapper {
          background: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
        }
        .leaflet-dark-popup .leaflet-popup-content {
          margin: 10px 12px;
        }
        .leaflet-dark-popup .leaflet-popup-tip {
          background: #0f172a;
        }
        .leaflet-dark-popup .leaflet-popup-close-button {
          color: #94a3b8;
        }
        .ward-tooltip {
          background: #0f172a;
          color: #e2e8f0;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 6px;
          box-shadow: none;
        }
        .ward-tooltip::before {
          border-top-color: #0f172a !important;
        }
        .complaint-pin {
          width: 14px;
          height: 14px;
          border-radius: 9999px;
          background: var(--pin-color);
          border: 2px solid #0b1220;
          opacity: var(--pin-opacity);
          box-shadow: 0 0 8px color-mix(in srgb, var(--pin-color) 60%, transparent);
          position: relative;
        }
        .complaint-pin.fresh::after {
          content: '';
          position: absolute;
          inset: -5px;
          border-radius: 9999px;
          border: 2px solid var(--pin-color);
          opacity: 0.8;
          animation: pulseRing 1.6s ease-out infinite;
        }
        .custom-cluster-icon {
          background: transparent;
          border: none;
        }
        .cluster-pill {
          width: 40px;
          height: 40px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          border: 2px solid rgba(15, 23, 42, 0.9);
          box-shadow: 0 8px 16px rgba(15, 23, 42, 0.35);
        }
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.9; }
          100% { transform: scale(1.9); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
