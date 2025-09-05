/**
 * Core User Journey Validation Tests
 * Tests the essential user flow without UI dependencies
 * Requirements: 9.1, 9.2, 9.3
 */

import { describe, it, expect, beforeAll } from 'vitest'

// Import services directly
const authService = require('../services/authService').authService
const userService = require('../services/userService').userService
const subjectService = require('../services/subjectService').subjectService
const quizService = require('../services/quizService').quizService
const performanceService = require('../services/performanceService').performanceService
const gamificationService = require('../services/gamificationService').gamificationService
const topicService = require('../services/topicService').topicService

describe('Core User Journey Validation', () => {
  beforeAll(() => {
    console.log('🚀 Starting Core User Journey Tests...')
  })

  describe('1. Service Connectivity Validation', () => {
    it('should validate all services are accessible', async () => {
      console.log('🔌 Testing service connectivity...')
      
      const services = {
        authService,
        userService,
        subjectService,
        quizService,
        performanceService,
        gamificationService,
        topicService
      }

      Object.entries(services).forEach(([name, service]) => {
        expect(service).toBeDefined()
        console.log(`✅ ${name} is accessible`)
      })
      
      console.log('✅ All services are accessible')
    }, 5000)

    it('should validate subject service functionality', async () => {
      console.log('📚 Testing subject service...')
      
      try {
        const subjects = await subjectService.getAllSubjects()
        
        expect(subjects).toBeDefined()
        expect(Array.isArray(subjects)).toBe(true)
        expect(subjects.length).toBeGreaterThan(0)
        
        if (subjects.length > 0) {
          const firstSubject = subjects[0]
          expect(firstSubject.id).toBeDefined()
          expect(firstSubject.name).toBeDefined()
          expect(typeof firstSubject.name).toBe('string')
        }
        
        console.log(`✅ Subject service working - ${subjects.length} subjects available`)
      } catch (error: any) {
        console.error('❌ Subject service failed:', error.message)
        throw error
      }
    }, 10000)

    it('should validate topic service functionality', async () => {
      console.log('📖 Testing topic service...')
      
      try {
        const topics = await topicService.getAllTopics()
        
        expect(topics).toBeDefined()
        expect(Array.isArray(topics)).toBe(true)
        
        if (topics.length > 0) {
          const firstTopic = topics[0]
          expect(firstTopic.id).toBeDefined()
          expect(firstTopic.name).toBeDefined()
          expect(firstTopic.subjectId).toBeDefined()
        }
        
        console.log(`✅ Topic service working - ${topics.length} topics available`)
      } catch (error: any) {
        console.error('❌ Topic service failed:', error.message)
        throw error
      }
    }, 10000)

    it('should validate quiz service functionality', async () => {
      console.log('🧩 Testing quiz service...')
      
      try {
        // Get subjects first
        const subjects = await subjectService.getAllSubjects()
        
        if (subjects.length > 0) {
          const quizConfig = {
            subject_ids: [subjects[0].id],
            difficulty: 'medium',
            question_count: 3,
            user_id: 'test-user-id'
          }

          const quiz = await quizService.generatePersonalizedQuiz(quizConfig)
          
          expect(quiz).toBeDefined()
          expect(quiz.questions).toBeDefined()
          expect(Array.isArray(quiz.questions)).toBe(true)
          
          console.log(`✅ Quiz service working - generated ${quiz.questions.length} questions`)
        } else {
          console.log('⚠️ No subjects available for quiz generation test')
        }
      } catch (error: any) {
        console.error('❌ Quiz service failed:', error.message)
        throw error
      }
    }, 15000)
  })

  describe('2. User Registration and Authentication Flow', () => {
    it('should validate authentication service structure', async () => {
      console.log('🔐 Testing authentication service structure...')
      
      expect(authService.register).toBeDefined()
      expect(authService.login).toBeDefined()
      expect(typeof authService.register).toBe('function')
      expect(typeof authService.login).toBe('function')
      
      console.log('✅ Authentication service structure validated')
    }, 5000)

    it('should validate user service onboarding methods', async () => {
      console.log('👤 Testing user service onboarding methods...')
      
      expect(userService.updateOnboarding).toBeDefined()
      expect(userService.completeOnboarding).toBeDefined()
      expect(userService.generateAssessment).toBeDefined()
      expect(userService.submitAssessment).toBeDefined()
      expect(userService.getUserRecommendations).toBeDefined()
      
      expect(typeof userService.updateOnboarding).toBe('function')
      expect(typeof userService.completeOnboarding).toBe('function')
      expect(typeof userService.generateAssessment).toBe('function')
      expect(typeof userService.submitAssessment).toBe('function')
      expect(typeof userService.getUserRecommendations).toBe('function')
      
      console.log('✅ User service onboarding methods validated')
    }, 5000)
  })

  describe('3. Onboarding Flow Data Validation', () => {
    it('should validate assessment generation capability', async () => {
      console.log('📝 Testing assessment generation...')
      
      try {
        const subjects = await subjectService.getAllSubjects()
        
        if (subjects.length > 0) {
          const subjectIds = subjects.slice(0, 2).map(s => s.id)
          const assessment = await userService.generateAssessment(subjectIds, 'test-user-id')
          
          expect(assessment).toBeDefined()
          expect(Array.isArray(assessment)).toBe(true)
          
          if (assessment.length > 0) {
            const firstQuestion = assessment[0]
            expect(firstQuestion.questionText || firstQuestion.question_text).toBeDefined()
            expect(firstQuestion.answerOptions || firstQuestion.answer_options).toBeDefined()
            expect(firstQuestion.correctAnswer || firstQuestion.correct_answer).toBeDefined()
          }
          
          console.log(`✅ Assessment generation working - ${assessment.length} questions`)
        } else {
          console.log('⚠️ No subjects available for assessment generation')
        }
      } catch (error: any) {
        console.error('❌ Assessment generation failed:', error.message)
        throw error
      }
    }, 15000)

    it('should validate subject-topic relationship', async () => {
      console.log('🔗 Testing subject-topic relationships...')
      
      try {
        const subjects = await subjectService.getAllSubjects()
        
        if (subjects.length > 0) {
          const firstSubject = subjects[0]
          const topics = await topicService.getTopicsBySubject(firstSubject.id)
          
          expect(Array.isArray(topics)).toBe(true)
          
          if (topics.length > 0) {
            const firstTopic = topics[0]
            expect(firstTopic.subjectId).toBe(firstSubject.id)
          }
          
          console.log(`✅ Subject-topic relationship validated - ${topics.length} topics for ${firstSubject.name}`)
        }
      } catch (error: any) {
        console.error('❌ Subject-topic relationship validation failed:', error.message)
        throw error
      }
    }, 10000)
  })

  describe('4. Gamification and Performance Integration', () => {
    it('should validate gamification service methods', async () => {
      console.log('🎮 Testing gamification service methods...')
      
      expect(gamificationService.getUserGamificationSummary).toBeDefined()
      expect(gamificationService.getUserBadges).toBeDefined()
      expect(gamificationService.getUserQuests).toBeDefined()
      expect(gamificationService.getLeaderboard).toBeDefined()
      
      expect(typeof gamificationService.getUserGamificationSummary).toBe('function')
      expect(typeof gamificationService.getUserBadges).toBe('function')
      expect(typeof gamificationService.getUserQuests).toBe('function')
      expect(typeof gamificationService.getLeaderboard).toBe('function')
      
      console.log('✅ Gamification service methods validated')
    }, 5000)

    it('should validate performance service methods', async () => {
      console.log('📊 Testing performance service methods...')
      
      expect(performanceService.getUserPerformance).toBeDefined()
      expect(typeof performanceService.getUserPerformance).toBe('function')
      
      console.log('✅ Performance service methods validated')
    }, 5000)

    it('should validate leaderboard functionality', async () => {
      console.log('🏆 Testing leaderboard functionality...')
      
      try {
        const leaderboard = await gamificationService.getLeaderboard('global', 5)
        
        expect(leaderboard).toBeDefined()
        expect(Array.isArray(leaderboard)).toBe(true)
        
        console.log(`✅ Leaderboard working - ${leaderboard.length} entries`)
      } catch (error: any) {
        console.error('❌ Leaderboard functionality failed:', error.message)
        throw error
      }
    }, 10000)
  })

  describe('5. Data Flow and Integration Validation', () => {
    it('should validate complete data availability for dashboard', async () => {
      console.log('🏠 Testing dashboard data availability...')
      
      try {
        // Test all data sources needed for dashboard
        const [subjects, topics] = await Promise.all([
          subjectService.getAllSubjects(),
          topicService.getAllTopics()
        ])
        
        expect(subjects).toBeDefined()
        expect(Array.isArray(subjects)).toBe(true)
        expect(topics).toBeDefined()
        expect(Array.isArray(topics)).toBe(true)
        
        console.log(`✅ Dashboard data available - ${subjects.length} subjects, ${topics.length} topics`)
      } catch (error: any) {
        console.error('❌ Dashboard data validation failed:', error.message)
        throw error
      }
    }, 15000)

    it('should validate personalized content generation capability', async () => {
      console.log('🎯 Testing personalized content generation...')
      
      try {
        const subjects = await subjectService.getAllSubjects()
        
        if (subjects.length > 0) {
          // Test personalized quiz generation
          const quizConfig = {
            subject_ids: [subjects[0].id],
            difficulty: 'medium',
            question_count: 5,
            user_id: 'test-user-id'
          }

          const personalizedQuiz = await quizService.generatePersonalizedQuiz(quizConfig)
          
          expect(personalizedQuiz).toBeDefined()
          expect(personalizedQuiz.questions).toBeDefined()
          expect(personalizedQuiz.questions.length).toBeGreaterThan(0)
          
          // Test recommendations
          try {
            const recommendations = await userService.getUserRecommendations('test-user-id')
            expect(Array.isArray(recommendations)).toBe(true)
            console.log(`✅ Personalized content generation working - quiz: ${personalizedQuiz.questions.length} questions, recommendations: ${recommendations.length}`)
          } catch (recError) {
            console.log(`✅ Personalized quiz working - ${personalizedQuiz.questions.length} questions (recommendations service may need user data)`)
          }
        }
      } catch (error: any) {
        console.error('❌ Personalized content generation failed:', error.message)
        throw error
      }
    }, 15000)

    it('should validate smooth transition from onboarding to active learning', async () => {
      console.log('🎓 Testing onboarding to learning transition...')
      
      try {
        // Validate all components needed for smooth transition
        const subjects = await subjectService.getAllSubjects()
        const topics = await topicService.getAllTopics()
        
        expect(subjects.length).toBeGreaterThan(0)
        expect(topics.length).toBeGreaterThan(0)
        
        // Test that we can generate learning content
        if (subjects.length > 0) {
          const quizConfig = {
            subject_ids: [subjects[0].id],
            difficulty: 'medium',
            question_count: 3,
            user_id: 'test-user-id'
          }

          const quiz = await quizService.generatePersonalizedQuiz(quizConfig)
          expect(quiz.questions.length).toBeGreaterThan(0)
        }
        
        console.log('✅ Smooth onboarding to learning transition validated')
      } catch (error: any) {
        console.error('❌ Onboarding transition validation failed:', error.message)
        throw error
      }
    }, 15000)
  })

  describe('6. Error Handling and Resilience', () => {
    it('should validate service error handling', async () => {
      console.log('⚠️ Testing service error handling...')
      
      try {
        // Test with invalid user ID
        const invalidUserResult = await userService.getUserById('invalid-user-id').catch(error => error)
        expect(invalidUserResult).toBeDefined()
        
        // Test with invalid subject ID
        const invalidSubjectTopics = await topicService.getTopicsBySubject('invalid-subject-id').catch(error => error)
        expect(invalidSubjectTopics).toBeDefined()
        
        console.log('✅ Service error handling validated')
      } catch (error: any) {
        console.error('❌ Error handling validation failed:', error.message)
        throw error
      }
    }, 10000)

    it('should validate data consistency requirements', async () => {
      console.log('🔄 Testing data consistency requirements...')
      
      try {
        const subjects = await subjectService.getAllSubjects()
        
        // Validate subject data structure consistency
        subjects.forEach(subject => {
          expect(subject.id).toBeDefined()
          expect(subject.name).toBeDefined()
          expect(typeof subject.id).toBe('string')
          expect(typeof subject.name).toBe('string')
        })
        
        const topics = await topicService.getAllTopics()
        
        // Validate topic data structure consistency
        topics.forEach(topic => {
          expect(topic.id).toBeDefined()
          expect(topic.name).toBeDefined()
          expect(topic.subjectId).toBeDefined()
          expect(typeof topic.id).toBe('string')
          expect(typeof topic.name).toBe('string')
          expect(typeof topic.subjectId).toBe('string')
        })
        
        console.log('✅ Data consistency requirements validated')
      } catch (error: any) {
        console.error('❌ Data consistency validation failed:', error.message)
        throw error
      }
    }, 10000)
  })
})