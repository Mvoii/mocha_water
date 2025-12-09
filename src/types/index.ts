export interface Report {
  id: string
  description: string
  image_path: string
  location?: string
  anonymous_display_name?: string
  created_at: string
  solved: boolean
  solved_at?: string | null
  solved_by?: string | null
}

export interface CreateReportRequest {
  description: string
  location?: string
  anonymous_display_name?: string
  image: File
}

export interface CreateReportResponse {
  report: Report
  error?: string
}

export interface SolveReportRequest {
  solved: boolean
}

export interface SolveReportResponse {
  report: Report
  error?: string
}
