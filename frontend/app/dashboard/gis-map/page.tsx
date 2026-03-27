'use client'

import dynamic from 'next/dynamic'

const GISMapClient = dynamic(() => import('@/components/gis-map-client'), { ssr: false })

export default function GISMapPage() {
  return <GISMapClient />
}
