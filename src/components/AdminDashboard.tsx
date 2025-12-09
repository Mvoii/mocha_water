'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import type { Report } from '@/types'
import Image from 'next/image'

export default function AdminDashboard() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'solved'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    fetchReports()

    // Subscribe to real-time changes
    const channel = supabase
      .channel('admin-reports-changes')
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
      let query = supabase.from('reports').select('*').order('created_at', { ascending: false })

      if (filter === 'pending') {
        query = query.eq('solved', false)
      } else if (filter === 'solved') {
        query = query.eq('solved', true)
      }

      const { data, error } = await query

      if (error) throw error

      setReports(data || [])
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleSolved(reportId: string, currentStatus: boolean) {
    if (updatingId) return // Prevent multiple simultaneous updates

    setUpdatingId(reportId)

    try {
      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        alert('Please log in again')
        return
      }

      // Call API endpoint to update solved status
      const response = await fetch(`/api/reports/${reportId}/solve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          solved: !currentStatus,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update report')
      }

      // Refresh reports
      await fetchReports()
    } catch (error: any) {
      console.error('Error updating report:', error)
      alert(error.message || 'Failed to update report')
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredReports = reports.filter((report) =>
    report.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-8">Loading reports...</div>
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Total Reports</div>
          <div className="text-3xl font-bold text-gray-900">{reports.length}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Pending</div>
          <div className="text-3xl font-bold text-yellow-600">
            {reports.filter((r) => !r.solved).length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-1">Solved</div>
          <div className="text-3xl font-bold text-green-600">
            {reports.filter((r) => r.solved).length}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-md transition-colors ${
                filter === 'pending'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('solved')}
              className={`px-4 py-2 rounded-md transition-colors ${
                filter === 'solved'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Solved
            </button>
          </div>

          <input
            type="text"
            placeholder="Search descriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                </th>
            </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
            {filteredReports.length === 0 ? (
            <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No reports found
                </td>
            </tr>
            ) : (
                filteredReports.map((report) => {
                    const imageUrl = supabase.storage
                    .from('report-images')
                    .getPublicUrl(report.image_path).data.publicUrl
                    return (
                        <tr key={report.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="relative w-16 h-16">
                                <Image
                                    src={imageUrl}
                                    alt="Report"
                                    fill
                                    className="object-cover rounded"
                                    sizes="64px"
                                />
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 line-clamp-2 max-w-md">
                                {report.description}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{report.location || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                                {new Date(report.created_at).toLocaleDateString()}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            {report.solved ? (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    Solved
                                </span>
                            ) : (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                    Pending
                                </span>
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                                onClick={() => toggleSolved(report.id, report.solved)}
                                disabled={updatingId === report.id}
                                className={`px-3 py-1 rounded ${
                                report.solved
                                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                                } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                            >
                                {updatingId === report.id
                                ? 'Updating...'
                                : report.solved
                                ? 'Mark Pending'
                                : 'Mark Solved'}
                            </button>
                        </td>
                    </tr>
                )
            })
          )}
        </tbody>
      </table>
    </div>
  </div>
</div>
)}

