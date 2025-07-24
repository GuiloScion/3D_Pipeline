import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Advanced 3D Modeling Studio - Viewer',
  description: 'A simplified 3D model viewer with photogrammetry capabilities',
  keywords: ['3D modeling', 'photogrammetry', 'Three.js', 'WebGL', 'viewer'],
  authors: [{ name: 'GuiloScion' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: '#111827',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden bg-gray-900 text-white antialiased">
        {children}
      </body>
    </html>
  )
}
