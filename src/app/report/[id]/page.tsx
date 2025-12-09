'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import type { Report } from '@/types'
import Image from 'next/image'

export default function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageUrl, setImageUrl] = useState<string>('')

  useEffect(() => {
    fetchReport()
  }, [params.id])

  async function fetchReport() {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      setReport(data)

      // Get public URL for image
      const { data: urlData } = supabase.storage
        .from('report-images')
        .getPublicUrl(data.image_path)

      setImageUrl(urlData.publicUrl)
    } catch (error) {
      console.error('Error fetching report:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Report Not Found</h1>
          <button
            onClick={() => router.push('/')}
            className="text-primary-600 hover:text-primary-700"
          >
            ← Back to Reports
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.push('/')}
        className="mb-6 text-primary-600 hover:text-primary-700 flex items-center"
      >
        ← Back to Reports
      </button>

      {/* Report Card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Image */}
        <div className="relative w-full h-96 bg-gray-100">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt="Report image"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Status Badge */}
          <div className="mb-4">
            {report.solved ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                ✓ Solved
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                ⚠ Pending
              </span>
            )}
          </div>

          {/* Description */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Report Details</h1>
          <p className="text-gray-700 mb-6 whitespace-pre-wrap">{report.description}</p>

          {/* Metadata */}
          <div className="border-t pt-4 space-y-2 text-sm text-gray-600">
            {report.location && (
              <div>
                <span className="font-semibold">Location:</span> {report.location}
              </div>
            )}
            {report.anonymous_display_name && (
              <div>
                <span className="font-semibold">Reported by:</span> {report.anonymous_display_name}
              </div>
            )}
            <div>
              <span className="font-semibold">Reported:</span>{' '}
              {new Date(report.created_at).toLocaleString()}
            </div>
            {report.solved_at && (
              <div>
                <span className="font-semibold">Solved:</span>{' '}
                {new Date(report.solved_at).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
