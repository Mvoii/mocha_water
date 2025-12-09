// --- tests/api.test.ts ---
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Next.js server components
vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
  NextResponse: {
    json: (data: any, init?: any) => ({
      json: async () => data,
      status: init?.status || 200,
      ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300,
    }),
  },
}))

// Mock Supabase admin client
const mockSupabaseAdmin = {
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(() => ({
        data: { path: 'test-image.jpg' },
        error: null,
      })),
      remove: vi.fn(() => ({ data: {}, error: null })),
      getPublicUrl: vi.fn(() => ({
        data: { publicUrl: 'https://example.com/test-image.jpg' },
      })),
    })),
  },
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: {
            id: 'test-id',
            description: 'Test report',
            image_path: 'test-image.jpg',
            created_at: new Date().toISOString(),
            solved: false,
          },
          error: null,
        })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: 'test-id',
              description: 'Test report',
              solved: true,
              solved_at: new Date().toISOString(),
              solved_by: 'admin-id',
            },
            error: null,
          })),
        })),
      })),
    })),
    select: vi.fn(() => ({
      order: vi.fn(() => ({
        data: [],
        error: null,
      })),
    })),
  })),
  auth: {
    getUser: vi.fn(() => ({
      data: { user: { id: 'admin-id' } },
      error: null,
    })),
  },
}

vi.mock('@/lib/supabase-server', () => ({
  supabaseAdmin: mockSupabaseAdmin,
  verifyAuthToken: vi.fn(async (token: string | null) => {
    if (token && token.startsWith('Bearer valid-token')) {
      return 'admin-id'
    }
    return null
  }),
}))

describe('Reports API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/reports', () => {
    it('should create a new report with valid data', async () => {
      const { POST } = await import('@/app/api/reports/route')

      // Create mock form data
      const formData = new FormData()
      const mockImage = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      formData.append('image', mockImage)
      formData.append('description', 'Water leak on Main Street')
      formData.append('location', 'Main Street')

      const mockRequest = {
        formData: vi.fn(async () => formData),
      } as any

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.report).toBeDefined()
      expect(data.report.description).toBe('Test report')
    })

    it('should reject request without image', async () => {
      const { POST } = await import('@/app/api/reports/route')

      const formData = new FormData()
      formData.append('description', 'Water leak')

      const mockRequest = {
        formData: vi.fn(async () => formData),
      } as any

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('required')
    })

    it('should reject description over 1000 characters', async () => {
      const { POST } = await import('@/app/api/reports/route')

      const formData = new FormData()
      const mockImage = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      formData.append('image', mockImage)
      formData.append('description', 'a'.repeat(1001))

      const mockRequest = {
        formData: vi.fn(async () => formData),
      } as any

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('1000 characters')
    })
  })

  describe('PATCH /api/reports/[id]/solve', () => {
    it('should mark report as solved with valid auth', async () => {
      const { PATCH } = await import('@/app/api/reports/[id]/solve/route')

      const mockRequest = {
        headers: {
          get: vi.fn((header: string) => {
            if (header === 'authorization') return 'Bearer valid-token-123'
            return null
          }),
        },
        json: vi.fn(async () => ({ solved: true })),
      } as any

      const response = await PATCH(mockRequest, { params: { id: 'test-id' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.report).toBeDefined()
      expect(data.report.solved).toBe(true)
    })

    it('should reject request without auth token', async () => {
      const { PATCH } = await import('@/app/api/reports/[id]/solve/route')

      const mockRequest = {
        headers: {
          get: vi.fn(() => null),
        },
        json: vi.fn(async () => ({ solved: true })),
      } as any

      const response = await PATCH(mockRequest, { params: { id: 'test-id' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should reject invalid solved value', async () => {
      const { PATCH } = await import('@/app/api/reports/[id]/solve/route')

      const mockRequest = {
        headers: {
          get: vi.fn((header: string) => {
            if (header === 'authorization') return 'Bearer valid-token-123'
            return null
          }),
        },
        json: vi.fn(async () => ({ solved: 'invalid' })),
      } as any

      const response = await PATCH(mockRequest, { params: { id: 'test-id' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid')
    })
  })
})
