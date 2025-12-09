'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase-client'
import type { Report } from '@/types'

interface ReportCardProps {
  report: Report
}

export default function ReportCard({ report }: ReportCardProps) {
  const [imageUrl, setImageUrl] = useState<string>('')

  useEffect(() => {
    // Get public URL for image
    const { data } = supabase.storage.from('report-images').getPublicUrl(report.image_path)
    setImageUrl(data.publicUrl)
  }, [report.image_path])

  return (
    <Link href={`/report/${report.id}`} className="block group">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        {/* Image */}
        <div className="relative w-full h-48 bg-gray-100">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt="Report image"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            {report.solved ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                ✓ Solved
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500 text-white">
                ⚠ Pending
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-gray-700 line-clamp-2 mb-2">{report.description}</p>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{new Date(report.created_at).toLocaleDateString()}</span>
            {report.location && <span className="truncate ml-2">📍 {report.location}</span>}
          </div>
        </div>
      </div>
    </Link>
  )
}
