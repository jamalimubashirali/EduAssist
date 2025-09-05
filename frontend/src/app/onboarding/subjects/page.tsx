'use client'

import React, { useState, useEffect } from 'react'
import { useOnboardingNavigation } from '@/hooks/useOnboardingNavigation'
import { useUserStore } from '@/stores/useUserStore'
import { useOnboardingSubjects } from '@/hooks/useOnboardingData'
import { motion } from 'framer-motion'
import { BookOpen, Check, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { subjectService } from '@/services/subjectService'

interface Subject {
  id: string
  name: string
  description: string
  difficulty_level: string
  category: string
  icon: string
}

const SUBJECT_CATEGORIES = [
  'All',
  'Mathematics',
  'Science', 
  'Language Arts',
  'Social Studies',
  'Computer Science',
  'Arts',
  'Health & PE',
  'Other'
]

// Helper functions for mapping
const getCategoryFromName = (name: string): string => {
  const lowerName = name.toLowerCase()
  if (lowerName.includes('math') || lowerName.includes('algebra') || lowerName.includes('geometry')) return 'Mathematics'
  if (lowerName.includes('science') || lowerName.includes('physics') || lowerName.includes('chemistry') || lowerName.includes('biology')) return 'Science'
  if (lowerName.includes('english') || lowerName.includes('literature') || lowerName.includes('writing')) return 'Language Arts'
  if (lowerName.includes('history') || lowerName.includes('geography') || lowerName.includes('social')) return 'Social Studies'
  if (lowerName.includes('computer') || lowerName.includes('programming') || lowerName.includes('coding')) return 'Computer Science'
  if (lowerName.includes('art') || lowerName.includes('music') || lowerName.includes('design')) return 'Arts'
  return 'Other'
}

const getIconFromName = (name: string): string => {
  const lowerName = name.toLowerCase()
  if (lowerName.includes('math')) return '📊'
  if (lowerName.includes('science')) return '🔬'
  if (lowerName.includes('english')) return '📚'
  if (lowerName.includes('history')) return '🏛️'
  if (lowerName.includes('computer')) return '💻'
  if (lowerName.includes('art')) return '🎨'
  return '📖'
}

export default function SubjectsStep() {
  const { handleNext, isLoading: isNavigating, error: navigationError } = useOnboardingNavigation({
    currentStep: 'subjects',
    nextStep: 'goals',
  });
  const { user } = useUserStore();
  
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchedSubjects, setSearchedSubjects] = useState<Subject[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // useEffect(() => {
  //   if (user) {
  //     setSelectedSubjects(user.onboarding?.subjects || []);
  //   }
  // }, [user,]);

  // Use React Query hook to fetch all subjects initially
  const { data: allSubjects, isLoading: isLoadingSubjects, error: queryError } = useOnboardingSubjects()

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  useEffect(() => {
    if (debouncedSearchTerm) {
      setIsSearching(true)
      subjectService.searchSubjects(debouncedSearchTerm)
        .then(results => {
          const formattedResults = results.map(s => ({
            ...s,
            difficulty_level: 'Medium', // Add default difficulty
            category: getCategoryFromName(s.name),
            icon: getIconFromName(s.name)
          }))
          setSearchedSubjects(formattedResults)
        })
        .finally(() => setIsSearching(false))
    } else {
      setSearchedSubjects([])
    }
  }, [debouncedSearchTerm])

  // Map subjects data to expected format
  const subjects: Subject[] = (allSubjects || []).map((subject: any) => ({
    id: subject.id,
    name: subject.name,
    description: subject.description || '',
    difficulty_level: 'Medium',
    category: getCategoryFromName(subject.name),
    icon: subject.icon || getIconFromName(subject.name)
  }))

  // Fallback subjects for when API fails
  const fallbackSubjects: Subject[] = [
    { id: '1', name: 'Mathematics', description: 'Algebra, Geometry, Calculus', difficulty_level: 'Medium', category: 'Mathematics', icon: '📊' },
    { id: '2', name: 'Science', description: 'Physics, Chemistry, Biology', difficulty_level: 'Medium', category: 'Science', icon: '🔬' },
    { id: '3', name: 'English', description: 'Literature, Grammar, Writing', difficulty_level: 'Easy', category: 'Language Arts', icon: '📚' },
    { id: '4', name: 'History', description: 'World History, US History', difficulty_level: 'Easy', category: 'Social Studies', icon: '🏛️' },
    { id: '5', name: 'Computer Science', description: 'Programming, Algorithms', difficulty_level: 'Hard', category: 'Computer Science', icon: '💻' },
    { id: '6', name: 'Art', description: 'Drawing, Painting, Design', difficulty_level: 'Easy', category: 'Arts', icon: '🎨' }
  ]

  // Determine which list of subjects to display
  const displaySubjects = searchTerm.length > 0 
    ? searchedSubjects 
    : (queryError ? fallbackSubjects : subjects)

  const fetchError = queryError ? 'Failed to load subjects from server. Showing default subjects.' : ''

  const toggleSubject = (subjectId: string) => {
    const newSelection = selectedSubjects.includes(subjectId)
      ? selectedSubjects.filter(id => id !== subjectId)
      : [...selectedSubjects, subjectId]
    
    setSelectedSubjects(newSelection)
  }

  const onContinue = async () => {
    if (selectedSubjects.length > 0) {
      await handleNext({ subjects: selectedSubjects });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-500/20 text-green-400 border-green-400/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30'
      case 'hard': return 'bg-red-500/20 text-red-400 border-red-400/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-400/30'
    }
  }

  if (isLoadingSubjects) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-400">Loading subjects...</p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <motion.div
        className="text-center space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold text-white">Choose Your Subjects</h2>
        <p className="text-gray-400">
          Select the subjects you want to focus on. You can always add more later!
        </p>
        {fetchError && (
          <Alert variant="destructive" className="mt-4 bg-red-500/10 border-red-500/30 text-red-400">
            <AlertDescription>{fetchError}</AlertDescription>
          </Alert>
        )}
      </motion.div>

      {/* Selection Summary */}
      {selectedSubjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-700/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-green-400 font-semibold">
                      {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''} selected
                    </p>
                    <p className="text-sm text-gray-400">
                      Great choice! We'll create personalized content for these subjects.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Search and Filter */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search for subjects like 'Physics' or 'History'..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800/60 border-gray-700/50 rounded-lg text-white focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </motion.div>

      {/* Error Message */}
      {fetchError && (
        <Card className="bg-red-900/20 border-red-700/30">
          <CardContent className="p-4">
            <p className="text-red-400 text-sm">{fetchError}</p>
          </CardContent>
        </Card>
      )}

      {/* Subjects Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {isSearching ? (
          <div className="flex items-center justify-center min-h-[200px] col-span-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <>
            {displaySubjects.map((subject) => (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.05 }}
              >
                <Card
                  onClick={() => toggleSubject(subject.id)}
                  className={`
                    cursor-pointer transition-all duration-200 h-full flex flex-col
                    bg-gray-800/40 border-2 
                    ${selectedSubjects.includes(subject.id)
                      ? 'border-purple-500 ring-2 ring-purple-500/50 shadow-lg shadow-purple-500/10'
                      : 'border-gray-700/60 hover:border-purple-600/70'
                    }
                  `}
                >
                  <CardContent className="p-4 flex flex-col items-center text-center space-y-3 flex-grow">
                    <div className="text-4xl mb-2">{subject.icon}</div>
                    <h3 className="font-bold text-white text-lg leading-tight break-words">{subject.name}</h3>
                    <p className="text-sm text-gray-400 leading-snug flex-grow min-h-[40px] break-words">
                      {subject.description}
                    </p>
                    <Badge variant="outline" className={`
                      ${getDifficultyColor(subject.difficulty_level)}
                      font-semibold text-xs px-2 py-1 mt-auto
                    `}>
                      {subject.difficulty_level}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </>
        )}
      </motion.div>

      {/* No Results */}
      {displaySubjects.length === 0 && !isLoadingSubjects && !isSearching && (
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No subjects found</h3>
            <p className="text-gray-400">
              Try adjusting your search terms or category filter.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <motion.div 
        className="flex justify-between items-center pt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Button variant="outline" onClick={() => window.history.back()} className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
          Back
        </Button>
        <div className="flex flex-col items-end space-y-2">
          <Button 
            onClick={onContinue} 
            disabled={selectedSubjects.length === 0 || isNavigating}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isNavigating ? 'Continuing...' : `Continue (${selectedSubjects.length})`}
          </Button>
          {navigationError && (
            <p className="text-sm text-red-400">{navigationError}</p>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
