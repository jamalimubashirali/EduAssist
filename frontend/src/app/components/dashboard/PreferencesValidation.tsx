'use client'

import { useUserStore } from '@/stores/useUserStore'
import { usePostOnboardingExperience } from '@/hooks/usePostOnboardingExperience'
import { usePostOnboardingValidation } from '@/hooks/useUserPreferencesValidation'
import { CheckCircle, AlertCircle, Settings, RefreshCw, RotateCcw } from 'lucide-react'

interface PreferencesValidationProps {
    validationStatus?: any;
}

export default function PreferencesValidation({ validationStatus }: PreferencesValidationProps = {}) {
    const { user } = useUserStore()
    const { 
        validation, 
        isLoading, 
        isUpdating,
        syncOnboardingData, 
        initializeExperience,
        needsPreferencesSync,
        needsGoalsSync,
        isSetupComplete
    } = usePostOnboardingValidation()

    if (!user || isSetupComplete) {
        return null
    }

    return (
        <div className="game-card p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Preferences & Goals Status</h3>
                </div>
                {isLoading && (
                    <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                )}
            </div>

            {validation && (
                <div className="space-y-3">
                    {/* Preferences Status */}
                    <div className="flex items-center gap-3">
                        {validation.hasPreferences ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                            <AlertCircle className="w-4 h-4 text-orange-400" />
                        )}
                        <div className="flex-1">
                            <div className="text-sm text-white">Learning Preferences</div>
                            <div className="text-xs text-gray-400">
                                {validation.hasPreferences
                                    ? `Stored: ${validation.details.preferences?.length || 0} main preferences, ${validation.details.onboardingPreferences?.length || 0} from onboarding`
                                    : 'No preferences stored yet'
                                }
                            </div>
                        </div>
                    </div>

                    {/* Goals Status */}
                    <div className="flex items-center gap-3">
                        {validation.hasGoals ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                            <AlertCircle className="w-4 h-4 text-orange-400" />
                        )}
                        <div className="flex-1">
                            <div className="text-sm text-white">Learning Goals</div>
                            <div className="text-xs text-gray-400">
                                {validation.hasGoals
                                    ? `Goals set: ${validation.details.goals?.length || 0} main goals, ${validation.details.onboardingGoals ? 'onboarding goals configured' : 'no onboarding goals'}`
                                    : 'No learning goals set yet'
                                }
                            </div>
                        </div>
                    </div>

                    {/* Assessment Results Status */}
                    <div className="flex items-center gap-3">
                        {validation.details.assessmentResults ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                            <AlertCircle className="w-4 h-4 text-orange-400" />
                        )}
                        <div className="flex-1">
                            <div className="text-sm text-white">Assessment Results</div>
                            <div className="text-xs text-gray-400">
                                {validation.details.assessmentResults
                                    ? `Assessment completed with ${validation.details.assessmentResults.overall_score || 0}% overall score`
                                    : 'Assessment not completed yet'
                                }
                            </div>
                        </div>
                    </div>

                    {/* Recommendations Status */}
                    <div className="flex items-center gap-3">
                        {validationStatus.recommendationsGenerated ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                            <AlertCircle className="w-4 h-4 text-orange-400" />
                        )}
                        <div className="flex-1">
                            <div className="text-sm text-white">Smart Recommendations</div>
                            <div className="text-xs text-gray-400">
                                {validationStatus.recommendationsGenerated
                                    ? 'Personalized recommendations are active'
                                    : 'Recommendations are being generated...'
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            {!isSetupComplete && (
                <div className="mt-4 pt-3 border-t border-gray-700">
                    <div className="flex flex-wrap gap-2">
                        {(needsPreferencesSync || needsGoalsSync) && (
                            <button
                                onClick={syncOnboardingData}
                                disabled={isUpdating}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs rounded-lg transition-colors flex items-center gap-1"
                            >
                                <RotateCcw className="w-3 h-3" />
                                Sync Onboarding Data
                            </button>
                        )}
                        <button
                            onClick={initializeExperience}
                            disabled={isUpdating}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs rounded-lg transition-colors flex items-center gap-1"
                        >
                            <RefreshCw className={`w-3 h-3 ${isUpdating ? 'animate-spin' : ''}`} />
                            Initialize Experience
                        </button>
                        <button
                            onClick={() => window.location.href = '/onboarding'}
                            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-lg transition-colors"
                        >
                            Update Preferences
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}