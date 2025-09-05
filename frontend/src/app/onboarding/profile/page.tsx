'use client'

import React, { useState, useEffect } from 'react'
import { useOnboardingNavigation } from '@/hooks/useOnboardingNavigation'
import { useUserStore } from '@/stores/useUserStore'
import { motion } from 'framer-motion'
import { User, GraduationCap, Camera } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const AVATARS = [
  '🧑‍🎓', '👩‍💻', '🧑‍🔬', '👨‍🎨', '🧑‍🚀', '👩‍⚕️',
  '👨‍🏫', '👩‍🎓', '🧑‍💼', '👨‍🎭', '👩‍🔬', '🧑‍🎨',
  '👨‍💻', '👩‍🚀', '🧑‍⚕️', '👨‍🎨', '👩‍🏫', '🧑‍🎭'
]

// const GRADE_LEVELS = [
//   { value: 'elementary', label: 'Elementary School (K-5)' },
//   { value: 'middle', label: 'Middle School (6-8)' },
//   { value: 'high', label: 'High School (9-12)' },
//   { value: 'college', label: 'College/University' },
// ]

export function ProfileStep() {
  const { handleNext, isLoading } = useOnboardingNavigation({
    currentStep: 'profile',
    nextStep: 'subjects',
  });
  const { user } = useUserStore();
  
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0])
  const [displayName, setDisplayName] = useState('')
  // const [bio, setBio] = useState('')
  // const [gradeLevel, setGradeLevel] = useState('')
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    if (user) {
      setSelectedAvatar(user.onboarding?.profile?.avatar || AVATARS[0]);
      setDisplayName(user.onboarding?.profile?.display_name || '');
      // setBio(user.onboarding?.profile?.bio || '');
      // setGradeLevel(user.onboarding?.profile?.grade_level || '');
    }
  }, [user,]);

  // Update validation
  useEffect(() => {
    setIsValid(displayName.trim().length >= 2)
  }, [displayName,])

  const onContinue = () => {
    if (isValid) {
      const profileData = {
        username: displayName.trim(),
        avatar: selectedAvatar,
        // bio: bio.trim(),
        // grade_level: gradeLevel,
      };
      handleNext(profileData);
    }
  };
    
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <motion.div
        className="text-center space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold text-white">Create Your Profile</h2>
        <p className="text-gray-400">
          Tell us a bit about yourself so we can personalize your experience
        </p>
      </motion.div>

      {/* Avatar Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Camera className="w-5 h-5" />
              <span>Choose Your Avatar</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-4xl">
                {selectedAvatar}
              </div>
            </div>
            
            <div className="grid grid-cols-6 gap-3">
              {AVATARS.map((avatar, index) => (
                <Button
                  key={index}
                  variant={selectedAvatar === avatar ? "default" : "outline"}
                  className={`p-4 h-auto text-2xl ${
                    selectedAvatar === avatar 
                      ? 'bg-purple-600 hover:bg-purple-700 border-purple-500' 
                      : 'bg-gray-700/50 hover:bg-gray-600/50 border-gray-600'
                  }`}
                  onClick={() => setSelectedAvatar(avatar)}
                >
                  {avatar}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Basic Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <User className="w-5 h-5" />
              <span>Basic Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="displayName" className="text-gray-300">
                Display Name *
              </Label>
              <Input
                id="displayName"
                placeholder="What should we call you?"
                value={displayName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 mt-1"
              />
              <p className="text-xs text-gray-400 mt-1">
                This is how you'll appear to other learners
              </p>
            </div>

            {/* <div>
              <Label htmlFor="gradeLevel" className="text-gray-300">
                Education Level *
              </Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white mt-1">
                  <SelectValue placeholder="Select your current education level" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {GRADE_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value} className="text-white hover:bg-gray-700">
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}

            {/*<div>
              <Label htmlFor="bio" className="text-gray-300">
                About You (Optional)
              </Label>
              <Textarea
                id="bio"
                placeholder="Tell us about your learning goals, interests, or anything else you'd like to share..."
                value={bio}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)}
                rows={3}
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 mt-1 resize-none"
                maxLength={200}
              />
              <p className="text-xs text-gray-400 mt-1">
                {bio.length}/200 characters
              </p>
            </div> */}
          </CardContent>
        </Card>
      </motion.div>

      {/* Learning Preferences Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-700/30">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What's Next?
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  After this step, we'll help you choose your subjects and set learning goals. 
                  Then we'll assess your current knowledge to create a personalized study plan just for you!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Validation Message & Continue Button */}
      <motion.div
        className="text-center pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {!isValid && (
          <p className="text-sm text-yellow-400 mb-4">
            Please fill in your display name and education level to continue.
          </p>
        )}
        <Button
          onClick={onContinue}
          disabled={!isValid || isLoading}
          size="lg"
          className="w-full max-w-xs mx-auto bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isLoading ? 'Saving...' : 'Continue'}
        </Button>
      </motion.div>
    </div>
  )
}

export default ProfileStep
