import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LOUD STYLES - Traditional Algerian Fashion',
  description: 'Discover our exquisite collection of traditional Algerian fashion designed for the modern woman.',
}

export default function LoudStylesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

