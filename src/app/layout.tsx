import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Community Water Report',
  description: 'Report and track water infrastructure issues in your community',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex justify-between items-center">
                <Link href="/" className="flex items-center space-x-2">
                  <span className="text-2xl">💧</span>
                  <span className="text-xl font-bold text-primary-600">
                    Community Water Report
                  </span>
                </Link>
                <div className="flex items-center space-x-4">
                  <Link
                    href="/"
                    className="text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    Reports
                  </Link>
                  <Link
                    href="/admin/login"
                    className="text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    Admin
                  </Link>
                </div>
              </div>
            </nav>
          </header>

          {/* Main Content */}
          <main>{children}</main>

          {/* Footer */}
          <footer className="bg-white border-t mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <p className="text-center text-gray-600 text-sm">
                Community Water Report - Helping communities track and solve water infrastructure
                issues
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
