import ReportForm from '@/components/ReportForm'
import ReportList from '@/components/ReportList'

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Report Water Infrastructure Issues
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Help your community by reporting broken pipes, leaks, flooding, or other water-related
          issues. No account required.
        </p>
      </div>

      {/* Report Form */}
      <div className="mb-16">
        <ReportForm />
      </div>

      {/* Reports List */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Reports</h2>
        <ReportList />
      </div>
    </div>
  )
}
