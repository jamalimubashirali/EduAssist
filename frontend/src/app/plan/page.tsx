'use client'

import { useUserStore } from '@/stores/useUserStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  Target, 
  Clock, 
  BookOpen,
  TrendingUp,
  Award
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function StudyPlanPage() {
  const { user } = useUserStore()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Study Plan</h1>
        <p className="text-gray-400">Personalized learning path based on your goals</p>
      </div>

      {/* Coming Soon */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Study Plans Coming Soon!</h2>
          <p className="text-gray-400 mb-6">
            We're working on personalized study plans to help you achieve your learning goals.
          </p>
          <Button variant="outline" className="border-gray-600 text-gray-300">
            Get Notified
          </Button>
        </CardContent>
      </Card>

      {/* Features Preview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <Target className="w-8 h-8 text-blue-400 mb-2" />
            <CardTitle className="text-white">Goal Setting</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm">
              Set specific learning objectives and track your progress towards them.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <Clock className="w-8 h-8 text-green-400 mb-2" />
            <CardTitle className="text-white">Time Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm">
              Optimize your study schedule with AI-powered time allocation.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <BookOpen className="w-8 h-8 text-purple-400 mb-2" />
            <CardTitle className="text-white">Adaptive Content</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm">
              Personalized content recommendations based on your learning style.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}