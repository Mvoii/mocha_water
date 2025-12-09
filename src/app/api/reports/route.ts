import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData()
    const image = formData.get('image') as File
    const description = formData.get('description') as string
    const location = formData.get('location') as string | null
    const anonymous_display_name = formData.get('anonymous_display_name') as string | null

    // Validate required fields
    if (!image || !description) {
      return NextResponse.json({ error: 'Image and description are required' }, { status: 400 })
    }

    // Validate description length
    if (description.length > 1000) {
      return NextResponse.json(
        { error: 'Description must be less than 1000 characters' },
        { status: 400 }
      )
    }

    // Validate image type
    if (!ALLOWED_TYPES.includes(image.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload JPEG, PNG, or WebP' },
        { status: 400 }
      )
    }

    // Validate image size
    if (image.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Image must be less than 5MB' }, { status: 400 })
    }

    // Generate unique filename
    const fileExt = image.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    // Convert File to ArrayBuffer and then to Buffer
    const arrayBuffer = await image.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage using service_role
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('report-images')
      .upload(fileName, buffer, {
        contentType: image.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    // Insert report into database using service_role
    const { data: report, error: dbError } = await supabaseAdmin
      .from('reports')
      .insert({
        description,
        image_path: uploadData.path,
        location: location || null,
        anonymous_display_name: anonymous_display_name || null,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Clean up uploaded image if database insert fails
      await supabaseAdmin.storage.from('report-images').remove([uploadData.path])
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
    }

    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const solved = searchParams.get('solved')

    let query = supabaseAdmin.from('reports').select('*').order('created_at', { ascending: false })

    if (solved === 'true') {
      query = query.eq('solved', true)
    } else if (solved === 'false') {
      query = query.eq('solved', false)
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }

    return NextResponse.json({ reports: data }, { status: 200 })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
