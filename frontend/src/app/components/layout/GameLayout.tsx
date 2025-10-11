'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Home,
  Target,
  Brain,
  TrendingUp,
  ShoppingBag,
  User,
  Bell,
  Menu,
  X,
  LogOut,
  BookOpen,
  Trophy,
  Award,
  Calendar,
  Flame,
  Milestone,
  Lightbulb,
  MessageCircle
} from 'lucide-react'
import XPBar from '../gamification/XPBar'
import StreakCounter from '../gamification/StreakCounter'
import { useNotificationStore } from '@/stores/useNotificationStore'
import { useUserStore } from '@/stores/useUserStore'

interface GameLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Subjects', href: '/subjects', icon: BookOpen },
  { name: 'Quiz Arena', href: '/quiz', icon: Brain },
  { name: 'AI Tutor', href: '/learning-assistant', icon: MessageCircle },
  // { name: 'Daily Challenge', href: '/daily-challenge', icon: Calendar },
  { name: 'Recommendations', href: '/recommendations', icon: Lightbulb },
  { name: 'Progress', href: '/progress', icon: TrendingUp },
  { name: 'Quests', href: '/quests', icon: Target },
  { name: 'Streak', href: '/streak', icon: Flame },
  { name: 'Badges', href: '/badges', icon: Award },
  // { name: 'Milestones', href: '/milestones', icon: Milestone },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  // { name: 'Shop', href: '/shop', icon: ShoppingBag },
  { name: 'Profile', href: '/profile', icon: User },
]

export default function GameLayout({ children }: GameLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { unreadCount } = useNotificationStore()
  const { user, logout } = useUserStore()

  // Ref to maintain sidebar scroll position
  const navRef = useRef<HTMLElement>(null)
  const scrollPositionRef = useRef<number>(0)

  // Save scroll position when navigating
  useEffect(() => {
    const navElement = navRef.current
    if (navElement) {
      // Restore previous scroll position
      navElement.scrollTop = scrollPositionRef.current

      // Save scroll position on scroll
      const handleScroll = () => {
        scrollPositionRef.current = navElement.scrollTop
      }

      navElement.addEventListener('scroll', handleScroll)
      return () => navElement.removeEventListener('scroll', handleScroll)
    }
  }, [pathname]) // Re-run when pathname changes

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Fixed Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-gray-800 border-b border-gray-700 px-4 sm:px-6 z-30 lg:left-72">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl navbar-brand text-white">EduAssist</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Notifications */}
            <Link href="/notifications" className="relative text-gray-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* User XP and Level */}
            {/* {user && (
              <div className="hidden md:flex items-center gap-4">
                <div className="px-2 py-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white text-sm level-text">
                  Level {user.level}
                </div>
                <div className="w-32">
                  <XPBar showDetails={false} size="sm" />
                </div>
              </div>
            )} */}
          </div>
        </div>
      </header>

      {/* Fixed Sidebar */}
      <motion.div
        className={`fixed top-0 left-0 bottom-0 w-72 bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        onWheel={(e) => {
          // Prevent scroll from bubbling to main content
          e.stopPropagation()
        }}
      >
        <div className="flex flex-col h-full">
          {/* Close button for mobile */}
          <div className="flex items-center justify-end p-4 lg:hidden">
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-white font-medium">{user.name}</div>
                  <div className="text-sm text-gray-400">Level {user.level}</div>
                </div>
              </div>
              <XPBar size="sm" />
            </div>
          )}

          {/* Navigation - Scrollable */}
          <nav
            ref={navRef}
            className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-thin"
            onWheel={(e) => {
              const element = e.currentTarget
              const { scrollTop, scrollHeight, clientHeight } = element

              // Prevent scroll bubbling when at scroll boundaries
              if (
                (e.deltaY < 0 && scrollTop === 0) ||
                (e.deltaY > 0 && scrollTop + clientHeight >= scrollHeight)
              ) {
                e.preventDefault()
                e.stopPropagation()
              }
            }}
          >
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-gray-700 space-y-4">
            <StreakCounter size="sm" clickable={false} />
            <button
              onClick={() => logout()}
              className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200 w-full"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="lg:ml-72">
        <main className="pt-16 min-h-screen bg-gray-900 overflow-y-auto">
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}


