// src/app/api/reports/[id]/solve/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, verifyAuthToken } from '@/lib/supabase-server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    const userId = await verifyAuthToken(authHeader)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { solved } = body

    if (typeof solved !== 'boolean') {
      return NextResponse.json({ error: 'Invalid solved status' }, { status: 400 })
    }

    // Update report using service_role
    const updateData: any = {
      solved,
      solved_at: solved ? new Date().toISOString() : null,
      solved_by: solved ? userId : null,
    }

    const { data: report, error: dbError } = await supabaseAdmin
      .from('reports')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Failed to update report' }, { status: 500 })
    }

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json({ report }, { status: 200 })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
