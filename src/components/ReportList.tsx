'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import type { Report } from '@/types'
import ReportCard from './ReportCard'

export default function ReportList() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'solved'>('all')
  // ✨ NEW: Added error state
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchReports()

    // Subscribe to real-time changes
    const channel = supabase
      .channel('reports-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchReports()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [filter])

  async function fetchReports() {
    try {
      // ✨ NEW: Clear any previous errors
      setError('')
      // ✨ CHANGED: Added .limit(50) for performance
      let query = supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(50)

      if (filter === 'pending') {
        query = query.eq('solved', false)
      } else if (filter === 'solved') {
        query = query.eq('solved', true)
      }

      const { data, error } = await query

      if (error) throw error

      setReports(data || [])
    } catch (error: any) {
      // ✨ CHANGED: Better error handling with user-friendly message
      console.error('Error fetching reports:', error)
      setError('Failed to load reports. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-48 rounded-t-lg"></div>
            <div className="bg-white p-4 rounded-b-lg">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ✨ NEW: Error display with retry button
  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border-2 border-red-200">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => {
            setLoading(true)
            fetchReports()
          }}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Filter Buttons */}
      {/* ✨ CHANGED: Added flex-wrap, better styling, report count, and emojis */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md transition-colors font-medium ${
            filter === 'all'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {/* ✨ NEW: Shows total count */}
          All Reports ({reports.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-md transition-colors font-medium ${
            filter === 'pending'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {/* ✨ NEW: Added emoji for visual clarity */}
          🔴 Pending
        </button>
        <button
          onClick={() => setFilter('solved')}
          className={`px-4 py-2 rounded-md transition-colors font-medium ${
            filter === 'solved'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {/* ✨ NEW: Added emoji for visual clarity */}
          ✅ Solved
        </button>
      </div>

      {/* Reports Grid */}
    {/* CHANGED: Enhanced empty state with icon and context-aware messages */}
      {reports.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          {/* ✨ NEW: Added icon */}
          <div className="text-5xl mb-4">📋</div>
          {/* ✨ NEW: Better messaging */}
          <p className="text-gray-600 text-lg mb-2">No reports found</p>
          <p className="text-gray-500 text-sm">
            {filter === 'all'
              ? 'Be the first to report a water issue!'
              : `No ${filter} reports at the moment.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  )
}
