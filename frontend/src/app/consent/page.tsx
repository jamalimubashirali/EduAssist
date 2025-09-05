'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  Shield, 
  Eye, 
  Lock, 
  Users, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  FileText,
  Heart
} from 'lucide-react'

export default function ConsentScreen() {
  const router = useRouter()
  const [consents, setConsents] = useState({
    terms: false,
    privacy: false,
    cookies: false,
    marketing: false
  })
  const [showDetails, setShowDetails] = useState<string | null>(null)

  const consentItems = [
    {
      id: 'terms',
      title: 'Terms of Service',
      description: 'I agree to the Terms of Service and Community Guidelines',
      icon: FileText,
      required: true,
      details: 'By accepting, you agree to use EduAssist responsibly, respect other users, and follow our community guidelines. You can access your data anytime and delete your account if needed.'
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      description: 'I understand how my data is collected, used, and protected',
      icon: Shield,
      required: true,
      details: 'We collect learning progress data to personalize your experience. Your data is encrypted, never sold, and you have full control over what information you share.'
    },
    {
      id: 'cookies',
      title: 'Cookie Usage',
      description: 'Allow cookies for better user experience and analytics',
      icon: Eye,
      required: false,
      details: 'Cookies help us remember your preferences, keep you logged in, and understand how you use EduAssist to improve our service.'
    },
    {
      id: 'marketing',
      title: 'Marketing Communications',
      description: 'Receive updates about new features and learning tips',
      icon: Heart,
      required: false,
      details: 'Get occasional emails about new subjects, features, and personalized learning tips. You can unsubscribe anytime.'
    }
  ]

  const handleConsentChange = (id: string, value: boolean) => {
    setConsents(prev => ({ ...prev, [id]: value }))
  }

  const canProceed = consents.terms && consents.privacy

  const handleContinue = () => {
    if (canProceed) {
      // Store consent preferences
      localStorage.setItem('eduassist_consents', JSON.stringify(consents))
      router.push('/avatar-setup')
    }
  }

  const handleBack = () => {
    router.push('/welcome')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
      <motion.div
        className="max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
          >
            <Lock className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Privacy & Consent</h1>
          <p className="text-gray-300">
            We respect your privacy. Please review and accept our policies to continue.
          </p>
        </div>

        {/* Consent Form */}
        <motion.div
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="space-y-6">
            {consentItems.map((item, index) => (
              <motion.div
                key={item.id}
                className="border border-gray-700/30 rounded-xl p-4 hover:border-purple-500/30 transition-all duration-300"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <item.icon className="w-5 h-5 text-purple-400" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-white font-semibold">{item.title}</h3>
                      {item.required && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm mb-3">{item.description}</p>

                    {/* Details Toggle */}
                    <button
                      onClick={() => setShowDetails(showDetails === item.id ? null : item.id)}
                      className="text-purple-400 text-sm hover:text-purple-300 transition-colors mb-3"
                    >
                      {showDetails === item.id ? 'Hide details' : 'Show details'}
                    </button>

                    {/* Details */}
                    {showDetails === item.id && (
                      <motion.div
                        className="bg-gray-900/50 rounded-lg p-3 mb-3 text-sm text-gray-300"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {item.details}
                      </motion.div>
                    )}

                    {/* Checkbox */}
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={consents[item.id as keyof typeof consents]}
                          onChange={(e) => handleConsentChange(item.id, e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
                          consents[item.id as keyof typeof consents]
                            ? 'bg-purple-500 border-purple-500'
                            : 'border-gray-600 hover:border-purple-400'
                        }`}>
                          {consents[item.id as keyof typeof consents] && (
                            <CheckCircle className="w-5 h-5 text-white absolute -top-0.5 -left-0.5" />
                          )}
                        </div>
                      </div>
                      <span className="text-white text-sm">
                        I agree to the {item.title}
                      </span>
                    </label>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Privacy Summary */}
        <motion.div
          className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <h4 className="text-blue-400 font-semibold mb-1">Your Data Rights</h4>
              <p className="text-blue-200 text-sm">
                You can access, modify, or delete your data anytime. We never sell your information 
                and use it only to improve your learning experience.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <button
            onClick={handleBack}
            className="flex-1 bg-gray-800/50 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold border border-gray-600 hover:bg-gray-700/50 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          
          <button
            onClick={handleContinue}
            disabled={!canProceed}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
              canProceed
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Progress Indicator */}
        <div className="flex justify-center mt-8">
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
