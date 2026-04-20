import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Atlax',
  description: '让知识开始替你工作',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}