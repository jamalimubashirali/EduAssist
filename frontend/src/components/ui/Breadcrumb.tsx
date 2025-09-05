'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`} aria-label="Breadcrumb">
      <Link 
        href="/dashboard" 
        className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
      >
        <Home className="w-4 h-4" />
        <span className="sr-only">Home</span>
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="w-4 h-4 text-gray-500" />
          {item.href && !item.current ? (
            <Link 
              href={item.href} 
              className="text-gray-400 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className={item.current ? 'text-white font-medium' : 'text-gray-400'}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}

// Helper function to generate breadcrumbs for common routes
export function generateBreadcrumbs(
  pathname: string, 
  params?: Record<string, string>,
  data?: { subject?: { id: string; name: string }, topic?: { id: string; name: string } }
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = []
  
  if (pathname.startsWith('/subjects')) {
    items.push({ label: 'Subjects', href: '/subjects' })
    
    if (params?.id && data?.subject) {
      items.push({ 
        label: data.subject.name, 
        href: `/subjects/${params.id}` 
      })
    }
  }
  
  if (pathname.startsWith('/topics')) {
    if (pathname === '/topics') {
      items.push({ label: 'Topics', current: true })
    } else if (params?.id && data?.topic) {
      // Add subject breadcrumb if we have the data
      if (data.subject) {
        items.push({ label: 'Subjects', href: '/subjects' })
        items.push({ 
          label: data.subject.name, 
          href: `/subjects/${data.subject.id}` 
        })
      } else {
        items.push({ label: 'Topics', href: '/topics' })
      }
      items.push({ label: data.topic.name, current: true })
    }
  }
  
  if (pathname.startsWith('/quiz')) {
    if (pathname.includes('/generate')) {
      items.push({ label: 'Generate Quiz', current: true })
    } else if (pathname.includes('/results')) {
      items.push({ label: 'Quiz Results', current: true })
    } else {
      items.push({ label: 'Quiz', current: true })
    }
  }
  
  return items
}