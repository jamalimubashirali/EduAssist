import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserSchema } from './schema/user.schema';
import { CreateUserDto } from './dto/create.user.dto';
import { UpdateUserDto } from './dto/update.user.dto';
import { QuestionsService } from '../questions/questions.service';
import { PerformanceService } from '../performance/performance.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { Attempt } from '../attempts/schema/attempts.schema';
import { SubjectsService } from 'src/subjects/subjects.service';
import { TopicsService } from 'src/topics/topics.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(Attempt.name) private attemptModel: Model<Attempt>,
        private readonly questionsService: QuestionsService,
        private readonly performanceService: PerformanceService,
        private readonly recommendationsService: RecommendationsService,
        private readonly subjectService: SubjectsService,
        private readonly topicService: TopicsService
    ) { }

    async findAll(): Promise<User[]> {
        return await this.userModel.find().exec();
    }

    async findById(id: string): Promise<User> {
        const user = await this.userModel.findById(new Types.ObjectId(id)).select("-password -token");
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

    async findByRefreshToken(token: string): Promise<User | null> {
        const user = await this.userModel.findOne({ token }).select("-password");
        if (!user) {
            throw new NotFoundException('User not found with the provided token');
        }
        return user;
    }

    async findByEmail(email: string): Promise<UserSchema | null> {
        const user = await this.userModel.findOne({ email });
        return user;
    }

    async createUser(createUserDto: CreateUserDto): Promise<UserSchema> {
        const newUser = new this.userModel(createUserDto);
        return await newUser.save();
    }

    async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        // Handle gamification-specific updates
        if ('xp_points' in updateUserDto) {
            // Reset daily/weekly counters if needed
            const user = await this.findById(id);
            const today = new Date();
            const lastReset = user.lastResetDate ? new Date(user.lastResetDate) : null;

            let resetData = {};

            // Reset daily counter if it's a new day
            if (!lastReset || !this.isToday(lastReset)) {
                resetData = { ...resetData, dailyQuizCount: 0 };
            }

            // Reset weekly counter if it's a new week
            if (!lastReset || this.isNewWeek(lastReset)) {
                resetData = { ...resetData, weeklyQuizCount: 0 };
            }

            // Increment counters
            const incrementData = {
                dailyQuizCount: (user.dailyQuizCount || 0) + 1,
                weeklyQuizCount: (user.weeklyQuizCount || 0) + 1,
                lastResetDate: today,
                ...resetData
            };

            updateUserDto = { ...updateUserDto, ...incrementData };
        }

        const updatedUser = await this.userModel
            .findByIdAndUpdate(new Types.ObjectId(id), updateUserDto, { new: true }).select("-password -token")
            .exec();

        if (!updatedUser) {
            throw new NotFoundException('User not found');
        }
        return updatedUser;
    }

    async deleteUser(id: string): Promise<void> {
        const result = await this.userModel.findByIdAndDelete(new Types.ObjectId(id));
        if (!result) {
            throw new NotFoundException('User not found');
        }
    }

    // Add this method specifically for token updates
    async updateRefreshToken(userId: string, refreshToken: string): Promise<User> {
        if (!Types.ObjectId.isValid(userId)) {
            throw new NotFoundException('Invalid user ID format');
        }

        const updatedUser = await this.userModel
            .findByIdAndUpdate(
                new Types.ObjectId(userId),
                { token: refreshToken }, // Direct field update, bypassing DTO
                { new: true }
            )
            .exec();

        if (!updatedUser) {
            throw new NotFoundException('User not found');
        }
        return updatedUser;
    }

    async updateOnboarding(id: string, payload: any): Promise<User> {
        const updates: any = {
            'onboarding.lastUpdatedAt': new Date(),
        };

        // Always update the step and status
        if (payload.step) {
            updates['onboarding.step'] = payload.step;
            updates['onboarding.status'] = payload.step === 'COMPLETION-SUMMARY' ? 'COMPLETED' : 'IN_PROGRESS';
            if (payload.step === 'COMPLETION-SUMMARY') {
                updates['onboarding.completedAt'] = new Date();
            }
        }

        // Handle data from specific steps
        if (payload.username) {
            updates.name = payload.username;
        }
        // if (payload.learning_style) {
        //     updates['onboarding.learning_style'] = payload.learning_style;
        // }

        if (payload.subjects) {
            updates.preferences = payload.subjects;
        }

        if (payload.goals) {
            const goalsList = [...(payload.goals.focus_areas || [])];
            if (payload.goals.custom_goal) {
                goalsList.push(payload.goals.custom_goal);
            }
            updates.goals = goalsList;
        }

        const updated = await this.userModel.findByIdAndUpdate(
            new Types.ObjectId(id),
            { $set: updates },
            { new: true }
        ).select('-password -token');

        if (!updated) throw new NotFoundException('User not found');
        return updated;
    }

    async updateProfileBasics(id: string, payload: any): Promise<User> {
        const updates: any = {}
        if (payload.avatar !== undefined) updates.avatar = payload.avatar
        if (payload.theme !== undefined) updates.theme = payload.theme
        if (payload.goals !== undefined) updates.goals = payload.goals
        const updated = await this.userModel.findByIdAndUpdate(new Types.ObjectId(id), { $set: updates }, { new: true }).select('-password -token')
        if (!updated) throw new NotFoundException('User not found')
        return updated
    }

    // Alternative method for clearing token
    async clearRefreshToken(userId: string): Promise<User> {
        return this.updateRefreshToken(userId, "");
    }

    // Assessment and onboarding methods
    async submitAssessment(body: {
        user_id: string;
        answers: Array<{
            question_id: string;
            user_answer: string;
            time_taken: number;
        }>;
        started_at: string;
        completed_at: string;
    }): Promise<any> {
        console.log('[submitAssessment] invoked', { user_id: body?.user_id, totalAnswers: body?.answers?.length })
        try {
            // Validate user_id and answers
            if (!Types.ObjectId.isValid(body.user_id)) {
                console.log('[submitAssessment] invalid user_id', body.user_id)
                throw new Error('Invalid user_id');
            }
            if (!body.answers || !Array.isArray(body.answers) || body.answers.length === 0) {
                console.log('[submitAssessment] no answers provided')
                throw new Error('No answers provided');
            }

            const totalQuestions = body.answers.length;
            let correctAnswers = 0;
            const subjectStats = new Map<string, { correct: number; total: number; name: string }>();
            const questionDetails: Array<{
                questionId: string;
                userAnswer: string;
                correctAnswer: string;
                isCorrect: boolean;
                timeTaken: number;
                subjectId: string;
                topicId: string;
            }> = [];

            // Get all question IDs for batch processing
            const questionIds = body.answers
                .filter(answer => Types.ObjectId.isValid(answer.question_id))
                .map(answer => new Types.ObjectId(answer.question_id));

            if (questionIds.length === 0) {
                throw new Error('No valid question IDs provided');
            }

            // Use aggregation pipeline to get all questions with subject/topic data in one query
            const questionsWithData = await this.questionsService.getQuestionsWithSubjectTopicData(questionIds);
            console.log('[submitAssessment] Retrieved questions with data:', questionsWithData.length);

            // Create a map for quick lookup
            const questionMap = new Map(questionsWithData.map(q => [q._id.toString(), q]));

            // Process answers using the retrieved data
            for (const answer of body.answers) {
                if (!Types.ObjectId.isValid(answer.question_id)) {
                    console.log('[submitAssessment] Invalid question_id, skipping', answer.question_id);
                    continue;
                }

                const question = questionMap.get(answer.question_id);
                if (!question) {
                    console.log('[submitAssessment] question not found, skipping', answer.question_id);
                    continue;
                }

                const isCorrect = answer.user_answer === question.correctAnswer;
                console.log('[submitAssessment] question checked', { questionId: answer.question_id, isCorrect });

                if (isCorrect) {
                    correctAnswers++;
                }

                // Extract IDs properly from the aggregation result
                const subjectId = question.subjectId._id ? question.subjectId._id.toString() : question.subjectId.toString();
                const topicId = question.topicId._id ? question.topicId._id.toString() : question.topicId.toString();
                const subjectName = question.subjectId.subjectName || 'Unknown Subject';

                // Validate that we have proper ObjectId strings
                if (!Types.ObjectId.isValid(subjectId) || !Types.ObjectId.isValid(topicId)) {
                    console.log('[submitAssessment] Invalid ObjectId format, skipping performance update', { 
                        subjectId, topicId, questionId: answer.question_id 
                    });
                    continue;
                }

                // Track subject performance
                if (!subjectStats.has(subjectId)) {
                    subjectStats.set(subjectId, { correct: 0, total: 0, name: subjectName });
                }
                const stats = subjectStats.get(subjectId)!;
                stats.total++;
                if (isCorrect) {
                    stats.correct++;
                }

                // Update question statistics (async, don't wait)
                this.questionsService.updateQuestionStats(
                    answer.question_id,
                    isCorrect,
                    answer.time_taken
                ).catch(err => console.log('[submitAssessment] Error updating question stats:', err.message));

                questionDetails.push({
                    questionId: answer.question_id,
                    userAnswer: answer.user_answer,
                    correctAnswer: question.correctAnswer,
                    isCorrect,
                    timeTaken: answer.time_taken,
                    subjectId,
                    topicId
                });
            }

            // Prevent division by zero
            const overallScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
            console.log('[submitAssessment] score computed', { totalQuestions, correctAnswers, overallScore })

            // Determine proficiency level
            let proficiency = 'BEGINNER';
            if (overallScore >= 80) proficiency = 'ADVANCED';
            else if (overallScore >= 60) proficiency = 'INTERMEDIATE';

            // Generate detailed subject analysis with real topic data
            const subjectAnalysis = await Promise.all(
                Array.from(subjectStats.entries()).map(async ([subjectId, stats]) => {
                    const scorePercentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                    let subjectProficiency = 'BEGINNER';
                    if (scorePercentage >= 80) subjectProficiency = 'ADVANCED';
                    else if (scorePercentage >= 60) subjectProficiency = 'INTERMEDIATE';

                    // Get actual topics for this subject from question details
                    const subjectQuestions = questionDetails.filter(q => q.subjectId === subjectId);
                    const topicPerformance = new Map<string, { correct: number; total: number; name: string }>();

                    // Calculate performance per topic using data from aggregation
                    for (const question of subjectQuestions) {
                        const topicId = question.topicId;
                        if (!topicPerformance.has(topicId)) {
                            // Get topic name from the question data (already fetched via aggregation)
                            const questionData = questionMap.get(question.questionId);
                            const topicName = questionData?.topicId?.topicName || 'Unknown Topic';
                            topicPerformance.set(topicId, { correct: 0, total: 0, name: topicName });
                        }
                        const topicStats = topicPerformance.get(topicId)!;
                        topicStats.total++;
                        if (question.isCorrect) {
                            topicStats.correct++;
                        }
                    }

                    // Determine strong and weak topics based on actual performance
                    const strongTopics: string[] = [];
                    const weakTopics: string[] = [];

                    topicPerformance.forEach((performance, topicId) => {
                        const topicAccuracy = performance.total > 0 ? (performance.correct / performance.total) * 100 : 0;
                        if (topicAccuracy >= 70) {
                            strongTopics.push(performance.name);
                        } else if (topicAccuracy < 50) {
                            weakTopics.push(performance.name);
                        }
                    });

                    return {
                        subject_id: subjectId,
                        subject_name: stats.name,
                        score_percentage: scorePercentage,
                        proficiency_level: subjectProficiency,
                        correct_answers: stats.correct,
                        total_questions: stats.total,
                        strong_topics: strongTopics,
                        weak_topics: weakTopics,
                        topic_breakdown: Array.from(topicPerformance.entries()).map(([topicId, performance]) => ({
                            topic_id: topicId,
                            topic_name: performance.name,
                            accuracy: performance.total > 0 ? Math.round((performance.correct / performance.total) * 100) : 0,
                            questions_answered: performance.total,
                            correct_answers: performance.correct
                        }))
                    };
                })
            );

            console.log('[submitAssessment] subjectAnalysis ready', { subjects: subjectAnalysis.length })

            // Generate personalized recommendations with real subject names
            const weakSubjects = subjectAnalysis.filter(s => s.score_percentage < 60);
            const strongSubjects = subjectAnalysis.filter(s => s.score_percentage >= 80);
            const recommendations = {
                study_plan: [
                    ...(weakSubjects.length > 0 ? [`Focus on ${weakSubjects.map(s => s.subject_name).join(', ')} - your areas needing improvement`] : []),
                    'Practice daily with recommended questions',
                    'Review weak topics regularly',
                    ...(strongSubjects.length > 0 ? [`Build on your strengths in ${strongSubjects.map(s => s.subject_name).join(', ')}`] : []),
                    'Maintain consistent study schedule'
                ],
                focus_areas: [
                    ...weakSubjects.map(s => s.subject_name),
                    ...(weakSubjects.length === 0 ? ['Continue strengthening all subjects'] : [])
                ],
                priority_subjects: weakSubjects.length > 0
                    ? weakSubjects.map(s => s.subject_name)
                    : subjectAnalysis.map(s => s.subject_name),
                recommended_daily_questions: proficiency === 'BEGINNER' ? 5 : proficiency === 'INTERMEDIATE' ? 8 : 12,
                study_time_per_day: proficiency === 'BEGINNER' ? 30 : proficiency === 'INTERMEDIATE' ? 45 : 60 // minutes
            };

            // Generate comprehensive, rule-based recommendations and improvement areas
            const comprehensiveRecommendations = this.generateComprehensiveRecommendations(
                overallScore,
                subjectAnalysis,
                questionDetails,
                proficiency,
                totalQuestions,
                correctAnswers
            );

            // Enhanced learning analytics calculation
            const learningAnalytics = this.calculateLearningAnalytics(
                questionDetails,
                body.answers,
                overallScore,
                subjectAnalysis
            );

            const xpEarned = totalQuestions * 10 + (correctAnswers * 5); // Base XP + bonus for correct answers
            const levelAchieved = Math.floor(overallScore / 20) + 1;

            const results = {
                overall_score: overallScore,
                total_questions: totalQuestions,
                correct_answers: correctAnswers,
                overall_proficiency: proficiency,
                subject_analysis: subjectAnalysis,
                recommendations: recommendations,
                comprehensive_recommendations: comprehensiveRecommendations,
                learning_analytics: learningAnalytics,
                xp_earned: xpEarned,
                level_achieved: levelAchieved,
                assessment_duration: Math.floor((new Date(body.completed_at).getTime() - new Date(body.started_at).getTime()) / 1000),
                question_details: questionDetails
            };

            console.log('[submitAssessment] results assembled', { overall_score: results.overall_score, xp_earned: results.xp_earned })

            // --- Skip Assessment Attempt Record for now ---
            // Assessment attempts require quizId and topicId which are not applicable for multi-subject assessments
            // We'll track assessment results through other means (onboarding data, performance records)
            let attemptId: string | null = null;
            console.log('[submitAssessment] Skipping attempt record creation for assessment (schema requires quizId/topicId)');

            // Store assessment results for performance tracking
            try {
                console.log('[submitAssessment] updating performance records', { detailsCount: questionDetails.length })
                for (const detail of questionDetails) {
                    // Validate ObjectIds before calling performance service
                    if (!Types.ObjectId.isValid(detail.topicId) || !Types.ObjectId.isValid(detail.subjectId)) {
                        console.log('[submitAssessment] Skipping performance update for invalid ObjectIds', {
                            topicId: detail.topicId,
                            subjectId: detail.subjectId,
                            questionId: detail.questionId
                        });
                        continue;
                    }

                    try {
                        await this.performanceService.updatePerformance(
                            body.user_id,
                            detail.topicId,
                            detail.subjectId,
                            {
                                score: detail.isCorrect ? 100 : 0,
                                timeSpent: detail.timeTaken,
                                questionsAnswered: 1,
                                correctAnswers: detail.isCorrect ? 1 : 0
                            }
                        );
                    } catch (perfError) {
                        console.log('[submitAssessment] Error updating individual performance record', {
                            error: perfError?.message || perfError,
                            topicId: detail.topicId,
                            subjectId: detail.subjectId
                        });
                    }
                }
                console.log('[submitAssessment] performance records updated')
            } catch (error) {
                console.log('[submitAssessment] Error storing performance data (continuing)', error?.message || error);
                // Don't fail the assessment if performance tracking fails
            }

            // --- Generate Real-time Intelligent Recommendations ---
            console.log('[submitAssessment] generating intelligent recommendations', { attemptId })
            const intelligentRecommendations = await this.generateIntelligentRecommendations(
                body.user_id,
                results,
                attemptId
            );
            console.log('[submitAssessment] intelligent recommendations generated', { count: intelligentRecommendations.length })

            // --- Enhanced Onboarding Data Storage ---
            console.log('[submitAssessment] updating onboarding assessment data')
            await this.updateOnboardingAssessmentData(body.user_id, results);
            console.log('[submitAssessment] onboarding data updated')

            // --- Gamification & Progress Update ---
            console.log('[submitAssessment] updating gamification metrics')
            const gamificationUpdate = await this.updateGamificationFromAssessment(
                body.user_id,
                results
            );
            console.log('[submitAssessment] gamification updated', gamificationUpdate)

            // Return comprehensive results
            return {
                ...results,
                attempt_id: attemptId,
                intelligent_recommendations: intelligentRecommendations,
                gamification_update: gamificationUpdate,
                recommendations: recommendations // Keep original recommendations for backward compatibility
            };
        } catch (error) {
            console.log('[submitAssessment] failed', { error: error?.message || error })
            throw new Error(`Failed to submit assessment: ${error.message}`);
        }
    }


    // Generate intelligent recommendations based on assessment results
    private async generateIntelligentRecommendations(userId: string, assessmentResults: any, attemptId: string | null): Promise<any[]> {
        try {
            const recommendations: any[] = [];

            // Generate recommendations for each weak subject
            for (const subject of assessmentResults.subject_analysis) {
                if (subject.score_percentage < 60) {
                    // Validate subject_id before using it
                    if (!Types.ObjectId.isValid(subject.subject_id)) {
                        console.log('[generateIntelligentRecommendations] Invalid subject_id, skipping', subject.subject_id);
                        continue;
                    }

                    try {
                        const recommendation = await this.recommendationsService.generateRecommendationFromAttempt(
                            userId,
                            attemptId || 'assessment_' + Date.now(),
                            subject.subject_id,
                            null, // No specific topic for assessment
                            subject.score_percentage,
                            assessmentResults.overall_score
                        );

                        if (recommendation) {
                            recommendations.push({
                                ...recommendation,
                                type: 'weak_area_focus',
                                priority: 'high',
                                source: 'assessment',
                                metadata: {
                                    ...recommendation.metadata,
                                    subjectId: subject.subject_id,
                                    currentScore: subject.score_percentage,
                                    targetScore: 75,
                                    weakTopics: subject.weak_topics,
                                    estimatedImprovement: Math.min(30, 75 - subject.score_percentage)
                                }
                            });
                        }
                    } catch (error) {
                        console.error(`Error generating recommendation for weak subject ${subject.subject_id}:`, error);
                    }
                }
            }

            // Generate advancement recommendations for strong subjects
            for (const subject of assessmentResults.subject_analysis) {
                if (subject.score_percentage >= 80) {
                    // Validate subject_id before using it
                    if (!Types.ObjectId.isValid(subject.subject_id)) {
                        console.log('[generateIntelligentRecommendations] Invalid subject_id for advancement, skipping', subject.subject_id);
                        continue;
                    }

                    try {
                        const recommendation = await this.recommendationsService.generateRecommendationFromAttempt(
                            userId,
                            attemptId || 'assessment_' + Date.now(),
                            subject.subject_id,
                            null,
                            subject.score_percentage,
                            assessmentResults.overall_score
                        );

                        if (recommendation) {
                            recommendations.push({
                                ...recommendation,
                                type: 'advancement_opportunity',
                                priority: 'medium',
                                source: 'assessment',
                                metadata: {
                                    ...recommendation.metadata,
                                    subjectId: subject.subject_id,
                                    currentScore: subject.score_percentage,
                                    strongTopics: subject.strong_topics,
                                    suggestedDifficulty: 'HARD'
                                }
                            });
                        }
                    } catch (error) {
                        console.error(`Error generating advancement recommendation for subject ${subject.subject_id}:`, error);
                    }
                }
            }

            // Generate study plan recommendation
            if (assessmentResults.recommendations?.study_plan) {
                recommendations.push({
                    id: 'study_plan_' + Date.now(),
                    userId: new Types.ObjectId(userId),
                    type: 'study_plan',
                    title: 'Personalized Study Plan',
                    description: 'AI-generated study plan based on your assessment performance',
                    recommendationReason: `Based on your ${assessmentResults.overall_score}% assessment score, we've created a personalized study plan focusing on ${assessmentResults.recommendations.focus_areas.slice(0, 2).join(' and ')}.`,
                    priority: 'high',
                    source: 'assessment',
                    suggestedDifficulty: assessmentResults.overall_proficiency,
                    recommendationStatus: 'PENDING',
                    metadata: {
                        dailyQuestions: assessmentResults.recommendations.recommended_daily_questions,
                        studyTimePerDay: assessmentResults.recommendations.study_time_per_day,
                        focusAreas: assessmentResults.recommendations.focus_areas,
                        prioritySubjects: assessmentResults.recommendations.priority_subjects,
                        estimatedTime: assessmentResults.recommendations.study_time_per_day
                    },
                    createdAt: new Date()
                });
            }


            return recommendations;
        } catch (error) {
            console.error('Error generating intelligent recommendations:', error);
            return [];
        }
    }

    // Update gamification metrics from assessment
    private async updateGamificationFromAssessment(userId: string, assessmentResults: any): Promise<any> {
        try {
            const user = await this.findById(userId);
            const today = new Date();
            const lastQuizDate = user.lastQuizDate ? new Date(user.lastQuizDate) : null;

            let streakCount = user.streakCount || 0;
            let longestStreak = user.longestStreak || 0;
            let dailyQuizCount = user.dailyQuizCount || 0;
            let weeklyQuizCount = user.weeklyQuizCount || 0;
            let totalQuizzesAttempted = user.totalQuizzesAttempted || 0;
            let averageScore = user.averageScore || 0;

            // Streak logic
            if (!lastQuizDate) {
                streakCount = 1;
            } else if (this.isYesterday(lastQuizDate)) {
                streakCount += 1;
            } else if (this.isToday(lastQuizDate)) {
                // Already completed today, no change
            } else {
                streakCount = 1;
            }
            longestStreak = Math.max(longestStreak, streakCount);

            // Daily/Weekly quiz count logic
            if (!lastQuizDate || !this.isToday(lastQuizDate)) {
                dailyQuizCount = 1;
            } else {
                dailyQuizCount += 1;
            }
            if (!lastQuizDate || this.isNewWeek(lastQuizDate)) {
                weeklyQuizCount = 1;
            } else {
                weeklyQuizCount += 1;
            }
            totalQuizzesAttempted += 1;

            // Average score update
            if (totalQuizzesAttempted > 1) {
                averageScore = ((user.averageScore || 0) * (totalQuizzesAttempted - 1) + assessmentResults.overall_score) / totalQuizzesAttempted;
            } else {
                averageScore = assessmentResults.overall_score;
            }

            // XP and level update
            const xp_points = (user.xp_points || 0) + assessmentResults.xp_earned;
            const level = Math.floor(xp_points / 100) + 1;

            // Check for badge unlocks
            const badgesUnlocked: string[] = [];

            // Assessment completion badges
            if (assessmentResults.overall_score >= 90) {
                badgesUnlocked.push('assessment-perfectionist');
            }
            if (assessmentResults.overall_score >= 75) {
                badgesUnlocked.push('assessment-achiever');
            }
            if (assessmentResults.total_questions >= 20) {
                badgesUnlocked.push('assessment-completionist');
            }
            if (streakCount >= 7) {
                badgesUnlocked.push('week-warrior');
            }

            // Update user with all gamification changes
            await this.userModel.findByIdAndUpdate(userId, {
                streakCount,
                longestStreak,
                lastQuizDate: today,
                dailyQuizCount,
                weeklyQuizCount,
                totalQuizzesAttempted,
                averageScore,
                xp_points,
                level,
                $addToSet: { unlockedBadges: { $each: badgesUnlocked } }
            });

            return {
                xpEarned: assessmentResults.xp_earned,
                newLevel: level,
                leveledUp: level > (user.level || 1),
                streakCount,
                streakIncreased: streakCount > (user.streakCount || 0),
                badgesUnlocked,
                totalXP: xp_points,
                newAverageScore: Math.round(averageScore * 10) / 10
            };
        } catch (error) {
            console.error('Error updating gamification from assessment:', error);
            return {
                xpEarned: 0,
                newLevel: 1,
                leveledUp: false,
                streakCount: 0,
                streakIncreased: false,
                badgesUnlocked: [],
                totalXP: 0,
                newAverageScore: 0
            };
        }
    }

    async getOnboardingProgress(userId: string): Promise<any> {
        try {
            const user = await this.findById(userId);
            return user.onboarding || null;
        } catch (error) {
            throw new Error(`Failed to get onboarding progress: ${error.message}`);
        }
    }

    async saveOnboardingProgress(userId: string, progressData: any): Promise<any> {
        try {
            const updates: any = {};
            if (progressData.current_step) updates['onboarding.current_step'] = progressData.current_step;
            if (progressData.total_steps) updates['onboarding.total_steps'] = progressData.total_steps;
            if (progressData.data) updates['onboarding.data'] = progressData.data;
            if (progressData.current_question_index) updates['onboarding.current_question_index'] = progressData.current_question_index;
            updates['onboarding.last_updated'] = new Date();

            const updatedUser = await this.userModel.findByIdAndUpdate(
                new Types.ObjectId(userId),
                { $set: updates },
                { new: true }
            ).select('-password -token');

            if (!updatedUser) {
                throw new NotFoundException('User not found');
            }

            return { message: 'Progress saved successfully' };
        } catch (error) {
            throw new Error(`Failed to save onboarding progress: ${error.message}`);
        }
    }

    // Calculate comprehensive learning analytics from assessment
    private calculateLearningAnalytics(questionDetails: any[], answers: any[], overallScore: number, subjectAnalysis: any[]): any {
        const totalTime = answers.reduce((sum, answer) => sum + (answer.time_taken || 0), 0);
        const averageTimePerQuestion = answers.length > 0 ? totalTime / answers.length : 0;

        // Calculate thinking patterns
        const thinkingTimes = answers.map(a => a.time_taken || 0);
        const quickAnswers = thinkingTimes.filter(t => t < 10).length;
        const thoughtfulAnswers = thinkingTimes.filter(t => t >= 10 && t <= 60).length;
        const slowAnswers = thinkingTimes.filter(t => t > 60).length;

        // Determine learning style based on performance patterns
        let learningStyle = 'BALANCED';
        if (quickAnswers > thoughtfulAnswers && overallScore >= 70) {
            learningStyle = 'INTUITIVE';
        } else if (thoughtfulAnswers > quickAnswers && overallScore >= 70) {
            learningStyle = 'ANALYTICAL';
        } else if (overallScore < 50) {
            learningStyle = 'NEEDS_SUPPORT';
        }

        // Calculate consistency score
        const scores = questionDetails.map(q => q.isCorrect ? 100 : 0);
        const variance = this.calculateVariance(scores);
        const consistencyScore = Math.max(0, 100 - variance);

        // Determine optimal difficulty progression
        const correctPercentage = (questionDetails.filter(q => q.isCorrect).length / questionDetails.length) * 100;
        let recommendedDifficulty = 'MEDIUM';
        if (correctPercentage >= 85) recommendedDifficulty = 'HARD';
        else if (correctPercentage < 60) recommendedDifficulty = 'EASY';

        return {
            studyPatterns: {
                averageTimePerQuestion: Math.round(averageTimePerQuestion),
                quickResponseRate: Math.round((quickAnswers / answers.length) * 100),
                thoughtfulResponseRate: Math.round((thoughtfulAnswers / answers.length) * 100),
                learningStyle: learningStyle
            },
            performanceMetrics: {
                consistencyScore: Math.round(consistencyScore),
                accuracyTrend: this.calculateAccuracyTrend(questionDetails),
                strongSubjects: subjectAnalysis.filter(s => s.score_percentage >= 75).map(s => s.subject_name),
                improvementAreas: subjectAnalysis.filter(s => s.score_percentage < 60).map(s => s.subject_name)
            },
            adaptiveRecommendations: {
                recommendedDifficulty: recommendedDifficulty,
                suggestedStudyTime: this.calculateOptimalStudyTime(overallScore, learningStyle),
                personalizedApproach: this.getPersonalizedApproach(learningStyle, overallScore),
                nextMilestones: this.generateNextMilestones(overallScore, subjectAnalysis)
            }
        };
    }

    // Helper method to calculate variance
    private calculateVariance(scores: number[]): number {
        const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const squaredDifferences = scores.map(score => Math.pow(score - mean, 2));
        return squaredDifferences.reduce((sum, diff) => sum + diff, 0) / scores.length;
    }

    // Calculate accuracy trend across questions
    private calculateAccuracyTrend(questionDetails: any[]): string {
        const firstHalf = questionDetails.slice(0, Math.floor(questionDetails.length / 2));
        const secondHalf = questionDetails.slice(Math.floor(questionDetails.length / 2));

        const firstHalfAccuracy = (firstHalf.filter(q => q.isCorrect).length / firstHalf.length) * 100;
        const secondHalfAccuracy = (secondHalf.filter(q => q.isCorrect).length / secondHalf.length) * 100;

        const improvement = secondHalfAccuracy - firstHalfAccuracy;

        if (improvement > 10) return 'IMPROVING';
        if (improvement < -10) return 'DECLINING';
        return 'STABLE';
    }

    // Calculate optimal study time based on performance and learning style
    private calculateOptimalStudyTime(score: number, learningStyle: string): number {
        let baseTime = 30; // minutes per day

        if (score < 50) baseTime = 45;
        else if (score > 80) baseTime = 20;

        if (learningStyle === 'ANALYTICAL') baseTime += 10;
        else if (learningStyle === 'INTUITIVE') baseTime -= 5;
        else if (learningStyle === 'NEEDS_SUPPORT') baseTime += 15;

        return Math.max(15, Math.min(60, baseTime));
    }

    // Get personalized learning approach
    private getPersonalizedApproach(learningStyle: string, score: number): string[] {
        const approaches: { [key: string]: string[] } = {
            INTUITIVE: [
                'Focus on quick practice sessions',
                'Use gamified learning elements',
                'Try varied question types',
                'Set short-term achievable goals'
            ],
            ANALYTICAL: [
                'Deep dive into concept explanations',
                'Practice step-by-step problem solving',
                'Review detailed solution explanations',
                'Focus on understanding patterns'
            ],
            NEEDS_SUPPORT: [
                'Start with fundamental concepts',
                'Use visual learning aids',
                'Practice with guided examples',
                'Build confidence with easier questions'
            ],
            BALANCED: [
                'Mix different question types',
                'Balance speed and accuracy',
                'Regular practice sessions',
                'Progressive difficulty increase'
            ]
        };

        return approaches[learningStyle] || approaches.BALANCED;
    }

    // Generate next learning milestones
    private generateNextMilestones(overallScore: number, subjectAnalysis: any[]): any[] {
        const milestones: any[] = [];

        // Overall improvement milestone
        if (overallScore < 75) {
            milestones.push({
                type: 'overall_improvement',
                target: Math.min(100, overallScore + 15),
                description: `Improve overall score to ${Math.min(100, overallScore + 15)}%`,
                timeframe: '2-3 weeks'
            });
        }

        // Subject-specific milestones
        const weakSubjects = subjectAnalysis.filter(s => s.score_percentage < 70);
        weakSubjects.slice(0, 2).forEach(subject => {
            milestones.push({
                type: 'subject_mastery',
                subject: subject.subject_name,
                target: 75,
                description: `Achieve 75% proficiency in ${subject.subject_name}`,
                timeframe: '3-4 weeks'
            });
        });

        return milestones;
    }

    // Update onboarding assessment data with comprehensive analytics
    private async updateOnboardingAssessmentData(userId: string, assessmentResults: any): Promise<void> {
        try {
            const updates = {
                'onboarding.assessmentData': {
                    totalQuestions: assessmentResults.total_questions,
                    correctAnswers: assessmentResults.correct_answers,
                    overallScore: assessmentResults.overall_score,
                    proficiencyLevel: assessmentResults.overall_proficiency,
                    timeSpent: assessmentResults.assessment_duration,
                    subjectBreakdown: assessmentResults.subject_analysis.reduce((acc: any, subject: any) => {
                        acc[subject.subject_name] = {
                            score: subject.score_percentage,
                            proficiency: subject.proficiency_level,
                            strongTopics: subject.strong_topics,
                            weakTopics: subject.weak_topics,
                            topicBreakdown: subject.topic_breakdown || []
                        };
                        return acc;
                    }, {}),
                    weakAreas: assessmentResults.subject_analysis
                        .filter((s: any) => s.score_percentage < 60)
                        .map((s: any) => s.subject_name),
                    strongAreas: assessmentResults.subject_analysis
                        .filter((s: any) => s.score_percentage >= 80)
                        .map((s: any) => s.subject_name),
                    learningStyle: assessmentResults.learning_analytics?.studyPatterns?.learningStyle || 'BALANCED',
                    recommendedPath: this.generateRecommendedLearningPath(assessmentResults),
                    initialDifficulty: assessmentResults.learning_analytics?.adaptiveRecommendations?.recommendedDifficulty || 'MEDIUM',
                    completedAt: new Date()
                },
                'onboarding.learningPreferences': {
                    studyTimePerDay: assessmentResults.learning_analytics?.adaptiveRecommendations?.suggestedStudyTime || 30,
                    preferredDifficulty: assessmentResults.learning_analytics?.adaptiveRecommendations?.recommendedDifficulty || 'MEDIUM',
                    focusAreas: assessmentResults.recommendations?.focus_areas || [],
                    targetScore: Math.min(100, assessmentResults.overall_score + 20),
                    weeklyGoal: assessmentResults.recommendations?.recommended_daily_questions || 5
                },
                'onboarding.progressMetrics': {
                    questionsAnswered: assessmentResults.total_questions,
                    averageAccuracy: assessmentResults.overall_score,
                    improvementRate: 0, // Will be calculated over time
                    consistencyScore: assessmentResults.learning_analytics?.performanceMetrics?.consistencyScore || 50,
                    engagementLevel: this.calculateEngagementLevel(assessmentResults)
                },
                'onboarding.lastUpdatedAt': new Date()
            };

            await this.userModel.findByIdAndUpdate(
                new Types.ObjectId(userId),
                { $set: updates },
                { new: true }
            );

            console.log(`Enhanced onboarding assessment data updated for user ${userId}`);
        } catch (error) {
            console.error('Error updating onboarding assessment data:', error);
            throw error;
        }
    }

    // Generate recommended learning path based on assessment results
    private generateRecommendedLearningPath(assessmentResults: any): string {
        const score = assessmentResults.overall_score;
        const weakSubjects = assessmentResults.subject_analysis.filter((s: any) => s.score_percentage < 60);

        if (score < 50) {
            return 'FOUNDATION_BUILDING';
        } else if (score < 70) {
            return 'SKILL_DEVELOPMENT';
        } else if (score < 85) {
            return 'MASTERY_FOCUSED';
        } else {
            return 'ADVANCED_CHALLENGE';
        }
    }

    // Calculate engagement level based on assessment behavior
    private calculateEngagementLevel(assessmentResults: any): string {
        const score = assessmentResults.overall_score;
        const timeSpent = assessmentResults.assessment_duration;
        const totalQuestions = assessmentResults.total_questions;
        const avgTimePerQuestion = timeSpent / totalQuestions;

        // High engagement: good score + appropriate time spent
        if (score >= 70 && avgTimePerQuestion >= 15 && avgTimePerQuestion <= 120) {
            return 'HIGH';
        }
        // Medium engagement: decent performance or time
        else if (score >= 50 || (avgTimePerQuestion >= 10 && avgTimePerQuestion <= 180)) {
            return 'MEDIUM';
        }
        // Low engagement: poor performance + rushed or excessive time
        else {
            return 'LOW';
        }
    }

    async completeOnboarding(userId: string, onboardingData: any): Promise<any> {
        try {
            const updates: any = {
                'onboarding.status': 'COMPLETED',
                'onboarding.completedAt': new Date(),
                'onboarding.lastUpdatedAt': new Date()
            };

            // Store any additional completion data
            if (onboardingData.finalPreferences) {
                updates['onboarding.learningPreferences'] = {
                    ...updates['onboarding.learningPreferences'],
                    ...onboardingData.finalPreferences
                };
            }

            const updatedUser = await this.userModel.findByIdAndUpdate(
                new Types.ObjectId(userId),
                { $set: updates },
                { new: true }
            ).select('-password -token');

            if (!updatedUser) {
                throw new NotFoundException('User not found');
            }

            return {
                message: 'Onboarding completed successfully',
                user: updatedUser,
                nextSteps: this.generatePostOnboardingRecommendations(updatedUser)
            };
        } catch (error) {
            throw new Error(`Failed to complete onboarding: ${error.message}`);
        }
    }

    // Generate post-onboarding recommendations
    private generatePostOnboardingRecommendations(user: any): any {
        const assessmentData = user.onboarding?.assessmentData;
        if (!assessmentData) {
            return {
                message: 'Complete your assessment to get personalized recommendations'
            };
        }

        return {
            immediateActions: [
                'Start with your recommended difficulty level',
                'Focus on your identified weak areas',
                'Set up a daily study routine'
            ],
            studyPlan: {
                dailyGoal: user.onboarding?.learningPreferences?.weeklyGoal || 5,
                focusSubjects: assessmentData.weakAreas?.slice(0, 2) || [],
                recommendedDifficulty: assessmentData.initialDifficulty || 'MEDIUM'
            },
            milestones: [
                {
                    target: 'Improve weak subject scores by 15%',
                    timeframe: '2 weeks'
                },
                {
                    target: 'Maintain daily study streak for 7 days',
                    timeframe: '1 week'
                }
            ]
        };
    }

    // Gamification Methods
    async getUserStats(userId: string) {
        const user = await this.findById(userId);

        // Calculate level from XP using square root formula
        const level = Math.floor(Math.sqrt(user.xp_points / 100)) + 1;

        // Get user's rank by comparing XP with other users
        const allUsers = await this.userModel.find({}, { xp_points: 1 }).sort({ xp_points: -1 });
        const rank = allUsers.findIndex(u => u._id.toString() === userId) + 1;
        const percentile = rank > 0 ? Math.max(1, 100 - Math.round((rank / allUsers.length) * 100)) : 0;

        const stats = {
            totalXP: user.xp_points || 0,
            level,
            currentStreak: user.streakCount || 0,
            longestStreak: user.longestStreak || 0,
            totalQuizzes: user.totalQuizzesAttempted || 0,
            totalBadges: user.unlockedBadges?.length || 0,
            averageScore: user.averageScore || 0,
            rank,
            percentile
        };

        return stats;
    }

    async getUserQuests(userId: string) {
        const user = await this.findById(userId);
        const performances = await this.performanceService.getUserTopicPerformances(userId);

        const quests: any[] = [];

        // Daily quiz quest
        quests.push({
            id: 'daily-quiz',
            title: 'Daily Challenge',
            description: 'Complete 3 quizzes today',
            type: 'daily',
            category: 'completion',
            difficulty: 'easy',
            xpReward: 100,
            progress: Math.min(user.dailyQuizCount || 0, 3),
            maxProgress: 3,
            isCompleted: (user.dailyQuizCount || 0) >= 3,
            isClaimed: user.completedQuests?.includes('daily-quiz') || false,
            createdAt: new Date().toISOString()
        });

        // Streak quest
        quests.push({
            id: 'streak-keeper',
            title: 'Streak Keeper',
            description: 'Maintain your learning streak',
            type: 'daily',
            category: 'consistency',
            difficulty: 'medium',
            xpReward: 50,
            progress: user.streakCount || 0,
            maxProgress: (user.streakCount || 0) + 1,
            isCompleted: user.lastQuizDate && this.isToday(user.lastQuizDate),
            isClaimed: false,
            createdAt: new Date().toISOString()
        });

        // Weekly challenge
        quests.push({
            id: 'weekly-warrior',
            title: 'Weekly Warrior',
            description: 'Complete 20 quizzes this week',
            type: 'weekly',
            category: 'completion',
            difficulty: 'hard',
            xpReward: 500,
            progress: user.weeklyQuizCount || 0,
            maxProgress: 20,
            isCompleted: (user.weeklyQuizCount || 0) >= 20,
            isClaimed: user.completedQuests?.includes('weekly-warrior') || false,
            expiresAt: this.getWeekEnd().toISOString(),
            createdAt: new Date().toISOString()
        });

        // Performance quest
        if (Array.isArray(performances) && performances.length > 0) {
            const averageScore = performances.reduce((sum: any, p: any) => sum + (p.averageScore || 0), 0) / performances.length;

            quests.push({
                id: 'accuracy-master',
                title: 'Accuracy Master',
                description: 'Achieve 90% accuracy in 5 quizzes',
                type: 'special',
                category: 'performance',
                difficulty: 'hard',
                xpReward: 300,
                progress: averageScore >= 90 ? 5 : 0,
                maxProgress: 5,
                isCompleted: averageScore >= 90,
                isClaimed: user.completedQuests?.includes('accuracy-master') || false,
                createdAt: new Date().toISOString()
            });
        }

        return quests;
    }

    async completeQuest(userId: string, questId: string) {
        const quests: any[] = await this.getUserQuests(userId);
        const quest = quests.find((q: any) => q.id === questId);

        if (!quest || !quest.isCompleted || quest.isClaimed) {
            throw new Error('Quest not available for completion');
        }

        // Update user XP and mark quest as completed
        await this.userModel.findByIdAndUpdate(userId, {
            $inc: { xp_points: quest.xpReward },
            $addToSet: { completedQuests: questId }
        });

        return { ...quest, isClaimed: true };
    }

    async getUserBadges(userId: string) {
        const user = await this.findById(userId);
        // Note: performances could be used for performance-based badges
        // const performances = await this.performanceService.getUserTopicPerformances(userId);

        const badges: any[] = [];

        // First quiz badge
        if (user.totalQuizzesAttempted > 0) {
            badges.push({
                id: 'first-quiz',
                name: 'First Steps',
                description: 'Complete your first quiz',
                icon: '🎯',
                rarity: 'common',
                category: 'milestone',
                unlockedAt: user.unlockedBadges?.includes('first-quiz') ? user.createdAt : null,
                progress: 1,
                maxProgress: 1
            });
        }

        // Quiz count badges
        const totalQuizzes = user.totalQuizzesAttempted || 0;
        if (totalQuizzes >= 10) {
            badges.push({
                id: 'quiz-explorer',
                name: 'Quiz Explorer',
                description: 'Complete 10 quizzes',
                icon: '🔍',
                rarity: 'common',
                category: 'completion',
                unlockedAt: user.unlockedBadges?.includes('quiz-explorer') ? user.updatedAt : null,
                progress: Math.min(totalQuizzes, 10),
                maxProgress: 10
            });
        }

        // Streak badges
        const currentStreak = user.streakCount || 0;
        if (currentStreak >= 7) {
            badges.push({
                id: 'week-warrior',
                name: 'Week Warrior',
                description: 'Maintain a 7-day streak',
                icon: '🔥',
                rarity: 'rare',
                category: 'consistency',
                unlockedAt: user.unlockedBadges?.includes('week-warrior') ? user.updatedAt : null,
                progress: Math.min(currentStreak, 7),
                maxProgress: 7
            });
        }

        // Performance badges
        if (user.averageScore >= 90) {
            badges.push({
                id: 'perfectionist',
                name: 'Perfectionist',
                description: 'Achieve 90% average score',
                icon: '⭐',
                rarity: 'epic',
                category: 'performance',
                unlockedAt: user.unlockedBadges?.includes('perfectionist') ? user.updatedAt : null,
                progress: Math.round(user.averageScore),
                maxProgress: 100
            });
        }

        return badges;
    } async unlockBadge(userId: string, badgeId: string) {
        await this.userModel.findByIdAndUpdate(userId, {
            $addToSet: { unlockedBadges: badgeId }
        });

        const badges: any[] = await this.getUserBadges(userId);
        return badges.find((badge: any) => badge.id === badgeId);
    }

    async updateStreak(userId: string) {
        const user = await this.findById(userId);
        const today = new Date();
        const lastQuizDate = user.lastQuizDate ? new Date(user.lastQuizDate) : null;

        let newStreakCount = user.streakCount || 0;
        let longestStreak = user.longestStreak || 0;



        if (!lastQuizDate) {
            // First quiz ever
            newStreakCount = 1;

        } else if (this.isYesterday(lastQuizDate)) {
            // Continue streak
            newStreakCount += 1;
        } else if (this.isToday(lastQuizDate)) {
            // Already completed today, no change
        } else {
            // Streak broken
            newStreakCount = 1;
        }

        longestStreak = Math.max(longestStreak, newStreakCount);

        const updatedUser = await this.userModel.findByIdAndUpdate(userId, {
            streakCount: newStreakCount,
            longestStreak,
            lastQuizDate: today
        }, { new: true }).select('-password -token');



        return updatedUser;
    }

    async getUserAchievements(userId: string) {
        const user = await this.findById(userId);
        const achievements: any[] = [];

        // First quiz achievement
        if (user.totalQuizzesAttempted > 0) {
            achievements.push({
                id: 'first-quiz-achievement',
                name: 'Getting Started',
                description: 'Complete your first quiz',
                icon: '🎉',
                unlockedAt: user.createdAt || new Date().toISOString(),
                xpReward: 50
            });
        }

        // Streak achievements
        if ((user.streakCount || 0) >= 7) {
            achievements.push({
                id: 'seven-day-streak',
                name: 'Week Champion',
                description: 'Maintain a 7-day learning streak',
                icon: '🔥',
                unlockedAt: new Date().toISOString(),
                xpReward: 200
            });
        }

        return achievements;
    }

    async getUserLeaderboardPosition(userId: string) {
        const allUsers = await this.userModel
            .find({}, {
                _id: 1,
                name: 1,
                xp_points: 1,
                level: 1,
                averageScore: 1,
                streakCount: 1,
                totalQuizzesAttempted: 1
            })
            .sort({ xp_points: -1 });

        const userIndex = allUsers.findIndex(user => user._id.toString() === userId);

        if (userIndex === -1) {
            throw new NotFoundException('User not found in leaderboard');
        }

        return {
            position: userIndex + 1,
            totalUsers: allUsers.length,
            percentile: Math.max(1, 100 - Math.round(((userIndex + 1) / allUsers.length) * 100)),
            nearbyUsers: this.getNearbyUsers(allUsers, userIndex)
        };
    }

    // Helper methods
    private isToday(date: Date): boolean {
        const today = new Date();
        const checkDate = new Date(date);
        return today.toDateString() === checkDate.toDateString();
    }

    private isYesterday(date: Date): boolean {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const checkDate = new Date(date);
        return yesterday.toDateString() === checkDate.toDateString();
    }

    private getWeekEnd(): Date {
        const now = new Date();
        const daysUntilSunday = 7 - now.getDay();
        const sunday = new Date(now);
        sunday.setDate(now.getDate() + daysUntilSunday);
        sunday.setHours(23, 59, 59, 999);
        return sunday;
    }

    private isNewWeek(lastDate: Date): boolean {
        const now = new Date();
        const last = new Date(lastDate);

        // Calculate the start of current week (Sunday)
        const startOfThisWeek = new Date(now);
        startOfThisWeek.setDate(now.getDate() - now.getDay());
        startOfThisWeek.setHours(0, 0, 0, 0);

        return last < startOfThisWeek;
    }

    private getNearbyUsers(allUsers: any[], userIndex: number) {
        const start = Math.max(0, userIndex - 2);
        const end = Math.min(allUsers.length, userIndex + 3);

        return allUsers.slice(start, end).map((user, index) => ({
            id: user._id,
            userName: user.name,
            totalXP: user.xp_points,
            level: Math.floor(Math.sqrt(user.xp_points / 100)) + 1,
            averageScore: user.averageScore || 0,
            currentStreak: user.streakCount || 0,
            rank: start + index + 1,
            completedQuizzes: user.totalQuizzesAttempted || 0
        }));
    }

    // Generate comprehensive, rule-based recommendations and improvement areas
    private generateComprehensiveRecommendations(
        overallScore: number,
        subjectAnalysis: any[],
        questionDetails: any[],
        proficiency: string,
        totalQuestions: number,
        correctAnswers: number
    ): any {
        const recommendations = {
            // Performance-based recommendations
            performance_insights: {
                overall_performance: this.getPerformanceInsight(overallScore),
                accuracy_rate: Math.round((correctAnswers / totalQuestions) * 100),
                improvement_potential: Math.max(0, 100 - overallScore),
                next_level_target: Math.min(100, overallScore + 15)
            },

            // Subject-specific recommendations
            subject_recommendations: this.generateSubjectRecommendations(subjectAnalysis),

            // Learning path recommendations
            learning_path: this.generateLearningPath(proficiency, overallScore, subjectAnalysis),

            // Practice recommendations
            practice_recommendations: this.generatePracticeRecommendations(questionDetails, subjectAnalysis),

            // Time management recommendations
            time_management: this.generateTimeManagementRecommendations(questionDetails),

            // Study strategy recommendations
            study_strategy: this.generateStudyStrategyRecommendations(overallScore, proficiency),

            // Specific improvement areas
            improvement_areas: this.generateImprovementAreas(subjectAnalysis, questionDetails),

            // Success factors
            success_factors: this.generateSuccessFactors(subjectAnalysis, overallScore)
        };

        return recommendations;
    }

    private getPerformanceInsight(score: number): string {
        if (score >= 90) return "Exceptional performance! You demonstrate mastery of the concepts.";
        if (score >= 80) return "Strong performance! You have a solid understanding of the material.";
        if (score >= 70) return "Good performance! You understand most concepts but have room for improvement.";
        if (score >= 60) return "Satisfactory performance! Focus on strengthening your foundation.";
        if (score >= 50) return "Below average performance. Review fundamental concepts and practice regularly.";
        return "Needs improvement. Start with basic concepts and build up gradually.";
    }

    private generateSubjectRecommendations(subjectAnalysis: any[]): any[] {
        return subjectAnalysis.map(subject => {
            const recommendations: any[] = [];

            if (subject.score_percentage < 50) {
                recommendations.push({
                    type: 'foundation',
                    priority: 'high',
                    action: 'Review fundamental concepts',
                    description: `Focus on basic ${subject.subject_name} concepts before moving to advanced topics.`,
                    specific_topics: subject.weak_topics.length > 0 ? subject.weak_topics : ['Basic concepts']
                });
            } else if (subject.score_percentage < 70) {
                recommendations.push({
                    type: 'practice',
                    priority: 'medium',
                    action: 'Practice medium-difficulty questions',
                    description: `Strengthen your ${subject.subject_name} skills with targeted practice.`,
                    specific_topics: subject.weak_topics.length > 0 ? subject.weak_topics : ['Core topics']
                });
            } else if (subject.score_percentage >= 80) {
                recommendations.push({
                    type: 'advancement',
                    priority: 'low',
                    action: 'Explore advanced topics',
                    description: `You're ready to tackle more challenging ${subject.subject_name} concepts.`,
                    specific_topics: subject.strong_topics.length > 0 ? subject.strong_topics : ['Advanced concepts']
                });
            }

            return {
                subject_name: subject.subject_name,
                current_score: subject.score_percentage,
                proficiency_level: subject.proficiency_level,
                recommendations: recommendations,
                focus_areas: subject.weak_topics,
                strength_areas: subject.strong_topics,
                topic_performance: subject.topic_breakdown || []
            };
        });
    }

    private generateLearningPath(proficiency: string, overallScore: number, subjectAnalysis: any[]): any {
        const weakSubjects = subjectAnalysis.filter(s => s.score_percentage < 60);
        const strongSubjects = subjectAnalysis.filter(s => s.score_percentage >= 80);
        const averageSubjects = subjectAnalysis.filter(s => s.score_percentage >= 60 && s.score_percentage < 80);

        return {
            current_level: proficiency,
            recommended_next_steps: [
                ...(weakSubjects.length > 0 ? [
                    `Prioritize ${weakSubjects.map(s => s.subject_name).join(', ')} - focus on fundamentals`,
                    `Review weak topics: ${weakSubjects.flatMap(s => s.weak_topics).slice(0, 3).join(', ')}`,
                    'Complete practice quizzes in weak areas'
                ] : []),
                ...(averageSubjects.length > 0 ? [
                    `Continue building skills in ${averageSubjects.map(s => s.subject_name).join(', ')}`
                ] : []),
                ...(strongSubjects.length > 0 ? [
                    `Maintain excellence in ${strongSubjects.map(s => s.subject_name).join(', ')}`,
                    `Advanced practice in: ${strongSubjects.flatMap(s => s.strong_topics).slice(0, 3).join(', ')}`
                ] : []),
                'Track progress with regular assessments'
            ],
            subject_focus_distribution: {
                weak_subjects: weakSubjects.map(s => ({
                    name: s.subject_name,
                    current_score: s.score_percentage,
                    target_score: Math.min(100, s.score_percentage + 25),
                    focus_topics: s.weak_topics
                })),
                strong_subjects: strongSubjects.map(s => ({
                    name: s.subject_name,
                    current_score: s.score_percentage,
                    maintenance_topics: s.strong_topics
                }))
            },
            estimated_time_to_next_level: this.estimateTimeToNextLevel(overallScore, proficiency),
            milestones: this.generateMilestones(overallScore, proficiency, subjectAnalysis)
        };
    }

    private generatePracticeRecommendations(questionDetails: any[], subjectAnalysis: any[]): any {
        const incorrectQuestions = questionDetails.filter(q => !q.isCorrect);
        const correctQuestions = questionDetails.filter(q => q.isCorrect);

        return {
            focus_areas: incorrectQuestions.map(q => ({
                question_id: q.questionId,
                subject_id: q.subjectId,
                topic_id: q.topicId,
                difficulty: 'medium',
                practice_type: 'targeted'
            })),
            reinforcement_areas: correctQuestions.map(q => ({
                question_id: q.questionId,
                subject_id: q.subjectId,
                topic_id: q.topicId,
                difficulty: 'hard',
                practice_type: 'advancement'
            })),
            daily_practice_goal: Math.max(5, Math.ceil(incorrectQuestions.length / 2)),
            weekly_practice_goal: Math.max(20, incorrectQuestions.length * 2),
            practice_strategy: this.getPracticeStrategy(incorrectQuestions.length, questionDetails.length)
        };
    }

    private generateTimeManagementRecommendations(questionDetails: any[]): any {
        const avgTimePerQuestion = questionDetails.reduce((sum, q) => sum + q.timeTaken, 0) / questionDetails.length;
        const slowQuestions = questionDetails.filter(q => q.timeTaken > avgTimePerQuestion * 1.5);

        return {
            average_time_per_question: Math.round(avgTimePerQuestion),
            time_management_issues: slowQuestions.length > 0 ? [
                'Some questions took longer than average',
                'Consider time management strategies',
                'Practice with timed quizzes'
            ] : [
                'Good time management demonstrated',
                'Maintain current pacing'
            ],
            recommended_practice_time: Math.max(15, Math.ceil(avgTimePerQuestion * 10)),
            time_optimization_tips: [
                'Read questions carefully but efficiently',
                'Skip difficult questions and return later',
                'Practice mental math for faster calculations',
                'Use elimination strategies for multiple choice'
            ]
        };
    }

    private generateStudyStrategyRecommendations(overallScore: number, proficiency: string): any {
        const strategies = {
            BEGINNER: [
                'Start with fundamental concepts',
                'Use visual learning aids',
                'Practice with simple examples',
                'Build confidence with easy questions',
                'Review basic formulas and definitions'
            ],
            INTERMEDIATE: [
                'Mix easy and challenging questions',
                'Focus on problem-solving techniques',
                'Practice time management',
                'Review mistakes thoroughly',
                'Connect related concepts'
            ],
            ADVANCED: [
                'Tackle complex problems',
                'Teach concepts to others',
                'Explore advanced topics',
                'Focus on speed and accuracy',
                'Challenge yourself with difficult questions'
            ]
        };

        return {
            recommended_strategies: strategies[proficiency as keyof typeof strategies] || strategies.INTERMEDIATE,
            study_schedule: this.generateStudySchedule(overallScore, proficiency),
            learning_techniques: this.getLearningTechniques(proficiency),
            motivation_tips: this.getMotivationTips(overallScore)
        };
    }

    private generateImprovementAreas(subjectAnalysis: any[], questionDetails: any[]): any {
        const weakSubjects = subjectAnalysis.filter(s => s.score_percentage < 60);
        const incorrectTopics = new Map();

        questionDetails.forEach(q => {
            if (!q.isCorrect) {
                const key = `${q.subjectId}-${q.topicId}`;
                incorrectTopics.set(key, (incorrectTopics.get(key) || 0) + 1);
            }
        });

        return {
            priority_subjects: weakSubjects.map(s => ({
                subject_name: s.subject_name,
                current_score: s.score_percentage,
                target_score: Math.min(100, s.score_percentage + 20),
                improvement_plan: this.getImprovementPlan(s.score_percentage),
                weak_topics: s.weak_topics,
                topic_performance: s.topic_breakdown || []
            })),
            specific_topics: Array.from(incorrectTopics.entries()).map(([key, count]) => {
                const [subjectId, topicId] = key.split('-');
                const subject = subjectAnalysis.find(s => s.subject_id === subjectId);

                // Find the actual topic name from the subject's topic breakdown
                let topicName = 'Unknown Topic';
                if (subject && subject.topic_breakdown) {
                    const topicInfo = subject.topic_breakdown.find((t: any) => t.topic_id === topicId);
                    topicName = topicInfo?.topic_name || topicName;
                }

                return {
                    subject_name: subject?.subject_name || 'Unknown',
                    topic_id: topicId,
                    topic_name: topicName,
                    error_count: count,
                    priority: count > 2 ? 'high' : 'medium'
                };
            }),
            improvement_timeline: this.generateImprovementTimeline(weakSubjects.length)
        };
    }

    private generateSuccessFactors(subjectAnalysis: any[], overallScore: number): any {
        const strongSubjects = subjectAnalysis.filter(s => s.score_percentage >= 80);
        const consistentSubjects = subjectAnalysis.filter(s => s.score_percentage >= 60);
        const strugglingSubjects = subjectAnalysis.filter(s => s.score_percentage < 60);

        return {
            strengths: strongSubjects.map(s => ({
                subject_name: s.subject_name,
                score: s.score_percentage,
                strong_topics: s.strong_topics,
                factors: this.getSuccessFactors(s.score_percentage)
            })),
            areas_for_growth: strugglingSubjects.map(s => ({
                subject_name: s.subject_name,
                score: s.score_percentage,
                weak_topics: s.weak_topics,
                improvement_potential: Math.max(0, 75 - s.score_percentage)
            })),
            consistency_indicators: {
                consistent_subjects: consistentSubjects.map(s => s.subject_name),
                consistent_count: consistentSubjects.length,
                total_subjects: subjectAnalysis.length,
                consistency_rate: Math.round((consistentSubjects.length / subjectAnalysis.length) * 100)
            },
            growth_indicators: {
                overall_growth_potential: Math.max(0, 100 - overallScore),
                subjects_with_growth_opportunity: subjectAnalysis
                    .filter(s => s.score_percentage < 80)
                    .map(s => ({
                        name: s.subject_name,
                        current_score: s.score_percentage,
                        potential_gain: Math.min(25, 80 - s.score_percentage)
                    })),
                next_milestone: this.getNextMilestone(overallScore)
            }
        };
    }

    private estimateTimeToNextLevel(score: number, proficiency: string): number {
        if (proficiency === 'BEGINNER') return Math.max(2, Math.ceil((70 - score) / 10));
        if (proficiency === 'INTERMEDIATE') return Math.max(3, Math.ceil((85 - score) / 8));
        return Math.max(4, Math.ceil((95 - score) / 5));
    }

    private generateMilestones(score: number, proficiency: string, subjectAnalysis?: any[]): any[] {
        const milestones: any[] = [];

        // Overall proficiency milestones
        if (proficiency === 'BEGINNER') {
            milestones.push({
                type: 'proficiency',
                target: 70,
                description: 'Reach Intermediate level overall',
                timeframe: '2-3 weeks'
            });
            milestones.push({
                type: 'proficiency',
                target: 80,
                description: 'Build strong foundation across all subjects',
                timeframe: '4-6 weeks'
            });
        } else if (proficiency === 'INTERMEDIATE') {
            milestones.push({
                type: 'proficiency',
                target: 85,
                description: 'Reach Advanced level overall',
                timeframe: '3-4 weeks'
            });
            milestones.push({
                type: 'proficiency',
                target: 90,
                description: 'Achieve mastery across subjects',
                timeframe: '6-8 weeks'
            });
        }

        // Subject-specific milestones if analysis is provided
        if (subjectAnalysis) {
            const weakSubjects = subjectAnalysis.filter(s => s.score_percentage < 70);
            weakSubjects.slice(0, 2).forEach(subject => {
                milestones.push({
                    type: 'subject_improvement',
                    subject_name: subject.subject_name,
                    current_score: subject.score_percentage,
                    target: 75,
                    description: `Improve ${subject.subject_name} to 75% proficiency`,
                    focus_topics: subject.weak_topics.slice(0, 2),
                    timeframe: '3-4 weeks'
                });
            });
        }

        return milestones;
    }

    private getPracticeStrategy(incorrectCount: number, totalCount: number): string {
        const errorRate = incorrectCount / totalCount;
        if (errorRate > 0.4) return 'Focus on fundamentals and basic concepts';
        if (errorRate > 0.2) return 'Practice medium-difficulty questions with targeted review';
        return 'Challenge yourself with advanced problems and speed practice';
    }

    private generateStudySchedule(score: number, proficiency: string): any {
        const baseTime = proficiency === 'BEGINNER' ? 30 : proficiency === 'INTERMEDIATE' ? 45 : 60;
        const adjustment = score < 60 ? 1.5 : score < 80 ? 1.2 : 0.8;

        return {
            daily_study_time: Math.round(baseTime * adjustment),
            weekly_sessions: Math.max(3, Math.ceil(7 * adjustment)),
            session_duration: Math.round(baseTime / Math.max(3, Math.ceil(7 * adjustment))),
            break_intervals: Math.round(baseTime / 4)
        };
    }

    private getLearningTechniques(proficiency: string): string[] {
        const techniques = {
            BEGINNER: ['Visual learning', 'Repetition', 'Simple examples', 'Step-by-step approach'],
            INTERMEDIATE: ['Active recall', 'Problem-solving', 'Concept mapping', 'Practice testing'],
            ADVANCED: ['Teaching others', 'Complex problem-solving', 'Speed practice', 'Advanced concepts']
        };
        return techniques[proficiency as keyof typeof techniques] || techniques.INTERMEDIATE;
    }

    private getMotivationTips(score: number): string[] {
        if (score >= 80) return ['Maintain your excellent performance', 'Help others learn', 'Set new challenging goals'];
        if (score >= 60) return ['You\'re making good progress', 'Focus on consistent improvement', 'Celebrate small wins'];
        return ['Every expert was once a beginner', 'Focus on progress, not perfection', 'Small improvements add up over time'];
    }

    private getImprovementPlan(score: number): string[] {
        if (score < 40) return ['Review basic concepts', 'Practice with simple questions', 'Build confidence gradually'];
        if (score < 60) return ['Strengthen fundamentals', 'Practice regularly', 'Review mistakes'];
        if (score < 80) return ['Focus on weak areas', 'Practice challenging questions', 'Improve time management'];
        return ['Maintain current level', 'Explore advanced topics', 'Help others learn'];
    }

    private generateImprovementTimeline(weakSubjectCount: number): any {
        return {
            immediate_focus: weakSubjectCount > 0 ? 'Address weak subjects first' : 'Maintain current performance',
            short_term: '2-3 weeks: Build strong foundation',
            medium_term: '1-2 months: Achieve consistent performance',
            long_term: '3-6 months: Master advanced concepts'
        };
    }

    private getSuccessFactors(score: number): string[] {
        if (score >= 90) return ['Strong conceptual understanding', 'Excellent problem-solving skills', 'Consistent performance'];
        if (score >= 80) return ['Good grasp of fundamentals', 'Effective study habits', 'Regular practice'];
        if (score >= 70) return ['Basic understanding', 'Some practice', 'Room for improvement'];
        return ['Learning in progress', 'Building foundation', 'Developing skills'];
    }

    private getNextMilestone(score: number): string {
        if (score < 60) return 'Reach 60% - Build solid foundation';
        if (score < 80) return 'Reach 80% - Achieve proficiency';
        if (score < 90) return 'Reach 90% - Master the content';
        return 'Maintain excellence - Help others learn';
    }
}