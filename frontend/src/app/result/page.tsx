'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/stores/useUserStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Trophy, 
  TrendingUp, 
  Target, 
  Star,
  ArrowRight
} from 'lucide-react'

export default function ResultsPage() {
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
        <h1 className="text-3xl font-bold text-white mb-2">Results</h1>
        <p className="text-gray-400">View your quiz results and performance analytics</p>
      </div>

      {/* No Results State */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No Results Yet</h2>
          <p className="text-gray-400 mb-6">
            Take some quizzes to see your results and track your progress here.
          </p>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            Start Your First Quiz
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Features Preview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <TrendingUp className="w-8 h-8 text-green-400 mb-2" />
            <CardTitle className="text-white">Performance Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm">
              Monitor your progress and improvement over time.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <Target className="w-8 h-8 text-blue-400 mb-2" />
            <CardTitle className="text-white">Detailed Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm">
              Get insights into your strengths and areas for improvement.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <Star className="w-8 h-8 text-yellow-400 mb-2" />
            <CardTitle className="text-white">Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm">
              Celebrate your milestones and learning achievements.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}