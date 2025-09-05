"use client";

import React from "react";
import { motion } from "framer-motion";
import { Brain, Trophy, Target, Users, Star, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOnboardingNavigation } from "@/hooks/useOnboardingNavigation";
import { useRequireAuth } from "@/hooks/useAuthProtection";

export function WelcomeStep() {
  // Protect this page - require authentication
  const { isLoading: authLoading, shouldRedirect } = useRequireAuth();
  const { handleNext, isLoading, error } = useOnboardingNavigation({
    currentStep: "welcome",
    nextStep: "profile",
  });

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white font-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  // Show redirecting message if not authenticated
  if (shouldRedirect) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white font-secondary">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: Brain,
      title: "Adaptive Learning",
      description:
        "Get personalized quizzes and study plans tailored to your learning style and pace",
      color: "from-purple-500 to-blue-500",
    },
    {
      icon: Trophy,
      title: "Gamified Experience",
      description:
        "Earn XP, unlock achievements, and compete on leaderboards while you learn",
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: Target,
      title: "Smart Assessments",
      description:
        "Take adaptive quizzes that challenge you at just the right level",
      color: "from-green-500 to-teal-500",
    },
    {
      icon: Users,
      title: "Community Learning",
      description: "Connect with peers, share progress, and learn together",
      color: "from-pink-500 to-red-500",
    },
  ];

  const benefits = [
    "📊 Track your progress with detailed analytics",
    "🎯 Get personalized recommendations based on your performance",
    "⚡ Boost retention with spaced repetition algorithms",
    "🏆 Earn badges and achievements for your accomplishments",
    "📱 Learn anywhere with our responsive platform",
    "🧠 Improve faster with AI-powered adaptive learning",
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Section */}
      <motion.div
        className="text-center space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl">
              <Brain className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="w-4 h-4 text-yellow-800" />
            </div>
          </div>
        </div>

        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              EduAssist
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Your AI-powered learning companion that makes studying engaging,
            effective, and fun. Let's set you up for academic success!
          </p>
        </div>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 * index }}
          >
            <Card className="bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70 transition-all duration-300 group">
              <CardContent className="p-6">
                <div
                  className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Benefits Section */}
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            What You'll Get
          </h2>
          <p className="text-gray-400">
            Everything you need to accelerate your learning journey
          </p>
        </div>

        <Card className="bg-gray-800/30 border-gray-700/50">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700/30 transition-colors duration-200"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                >
                  <span className="text-lg">{benefit.split(" ")[0]}</span>
                  <span className="text-gray-300 text-sm">
                    {benefit.substring(benefit.indexOf(" ") + 1)}
                  </span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        className="text-center space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <p className="text-gray-300">
          Ready to transform your learning experience? Let's get started!
        </p>
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
          <Star className="w-4 h-4 text-yellow-400" />
          <span>This setup will only take 2-3 minutes</span>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </motion.div>

      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <Button
          onClick={() => handleNext()}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={isLoading}
        >
          {isLoading ? "Setting up..." : "Get Started"}
        </Button>
      </motion.div>
    </div>
  );
}

export default WelcomeStep;
