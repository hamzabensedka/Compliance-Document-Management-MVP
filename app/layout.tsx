import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Compliance Document Portal',
  description: 'Secure multi-tenant compliance document management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

