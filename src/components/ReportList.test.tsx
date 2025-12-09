/* 'use client'

import { useState, FormEvent, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
const [filter, setFilter] = useState<'all' | 'pending' | 'solved'>('all')

const [error, setError] = useState<string>('')

export default function ReportForm() {
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please upload a JPEG, PNG, or WebP image')
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be less than 5MB')
      return
    }

    setError('')
    setImage(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!image) {
      setError('Please select an image')
      setLoading(false)
      return
    }

    if (description.length > 1000) {
      setError('Description must be less than 1000 characters')
      setLoading(false)
      return
    }

    try {
      // Create FormData
      const formData = new FormData()
      formData.append('image', image)
      formData.append('description', description)
      if (location) formData.append('location', location)
      if (displayName) formData.append('anonymous_display_name', displayName)

      // Submit to API
      const response = await fetch('/api/reports', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create report')
      }

      // Success
      setSuccess(true)
      setDescription('')
      setLocation('')
      setDisplayName('')
      setImage(null)
      setImagePreview('')

      // Redirect to the new report after a short delay
      setTimeout(() => {
        router.push(`/report/${data.report.id}`)
      }, 1500)
    } catch (error: any) {
      setError(error.message || 'Failed to submit report')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-green-600 text-5xl mb-4">✓</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Report Submitted!</h3>
        <p className="text-gray-600">Thank you for helping your community. Redirecting...</p>
      </div>
    )
  }
  async function fetchReports() {
  try {
    setError('')
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
    console.error('Error fetching reports:', error)
    setError('Failed to load reports. Please refresh the page.')
  } finally {
    setLoading(false)
  }
}


  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Submit a New Report</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photo of Issue <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-12 h-12 mb-3 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, or WebP (MAX. 5MB)</p>
                </div>
              )}
              <input
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                required
              />
            </label>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            maxLength={1000}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Describe the water infrastructure issue (e.g., broken pipe, leak, flooding)..."
          />
          <p className="mt-1 text-sm text-gray-500">{description.length}/1000 characters</p>
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Location (Optional)
          </label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="e.g., Main Street near City Hall, Zone 3B"
          />
        </div>

        {/* Display Name */}
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
            Your Name (Optional, Anonymous)
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="e.g., Concerned Resident"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 text-white py-3 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Submitting Report...' : 'Submit Report'}
        </button>
      </form>
    </div>
  )
}