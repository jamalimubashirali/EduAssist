"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useUserStore } from "@/stores/useUserStore";
import { useRedirectIfAuthenticated } from "@/hooks/useAuthProtection";
import {
  Brain,
  Trophy,
  Target,

  Users,
  BookOpen,
  Star,
  ArrowRight,
  Play,
  Award,
  TrendingUp,
  Gamepad2,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  
  // Handle auth redirection with custom logic for onboarding
  const { isAuthenticated, isLoading, shouldRedirect, user } = useRedirectIfAuthenticated();

  // Custom redirection logic for authenticated users
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.onboarding?.status === 'COMPLETED') {
        router.push('/dashboard');
      } else {
        // Redirect to current onboarding step or start onboarding
        const currentStep = user.onboarding?.step?.toLowerCase() || 'welcome';
        router.push(`/onboarding/${currentStep}`);
      }
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white font-secondary">Loading EduAssist...</p>
        </div>
      </div>
    );
  }

  // Show redirecting message if authenticated
  if (shouldRedirect || isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white font-secondary">Redirecting...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Learning",
      description:
        "Personalized study paths that adapt to your learning style and pace",
      color: "from-purple-500 to-blue-500",
    },
    {
      icon: Trophy,
      title: "Gamified Experience",
      description: "Earn XP, unlock achievements, and compete on leaderboards",
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: Target,
      title: "Smart Quizzes",
      description:
        "Interactive quizzes that challenge and reinforce your knowledge",
      color: "from-green-500 to-teal-500",
    },
    {
      icon: Users,
      title: "Community Learning",
      description: "Connect with peers, share progress, and learn together",
      color: "from-pink-500 to-red-500",
    },
  ];

  const stats = [
    { number: "10K+", label: "Active Learners", icon: Users },
    { number: "50K+", label: "Quizzes Completed", icon: BookOpen },
    { number: "95%", label: "Success Rate", icon: TrendingUp },
    { number: "4.9★", label: "User Rating", icon: Star },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 text-white overflow-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center px-4">
        {/* Background Animation */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-2000"></div>
        </div>

        <div className="relative z-10 text-center max-w-6xl mx-auto">
          {/* Logo and Brand */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -50 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl md:text-7xl brand-text text-white">
                EDUASSIST
              </h1>
            </div>
            <div className="w-32 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto rounded-full"></div>
          </motion.div>

          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-3xl md:text-5xl font-secondary font-bold mb-6 leading-tight">
              Level Up Your Learning
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                With Gamified Education
              </span>
            </h2>
            <p className="text-xl md:text-2xl font-secondary text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Transform your study sessions into exciting adventures. Earn XP,
              unlock achievements, and master new skills with our AI-powered
              learning platform.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <button
              onClick={() => router.push("/register")}
              className="group bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-8 py-4 rounded-xl font-secondary font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center gap-3"
            >
              <Play className="w-5 h-5" />
              Start Learning Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => router.push("/login")}
              className="group border-2 border-purple-500 hover:bg-purple-500 px-8 py-4 rounded-xl font-secondary font-semibold text-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-3"
            >
              <Gamepad2 className="w-5 h-5" />
              Continue Journey
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <stat.icon className="w-6 h-6 text-purple-400 mr-2" />
                  <div className="text-2xl md:text-3xl font-primary text-white">
                    {stat.number}
                  </div>
                </div>
                <div className="text-gray-400 font-secondary text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-purple-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-purple-400 rounded-full mt-2 animate-bounce"></div>
          </div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h3 className="text-3xl md:text-4xl main-heading text-white mb-6">
              WHY CHOOSE EDUASSIST?
            </h3>
            <p className="text-xl font-secondary text-gray-300 max-w-3xl mx-auto">
              Experience the future of education with features designed to make
              learning engaging, effective, and enjoyable.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="game-card p-6 text-center hover:transform hover:scale-105 transition-all duration-300"
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}
                >
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-secondary font-semibold text-white mb-3">
                  {feature.title}
                </h4>
                <p className="font-secondary text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl md:text-4xl main-heading text-white mb-6">
              READY TO START YOUR JOURNEY?
            </h3>
            <p className="text-xl font-secondary text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of learners who are already leveling up their
              skills. Your educational adventure awaits!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => router.push("/register")}
                className="group bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 px-10 py-4 rounded-xl font-secondary font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center gap-3"
              >
                <Award className="w-5 h-5" />
                Begin Your Quest
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-8 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <p className="font-secondary text-gray-400">
            © 2025 EduAssist. Transforming education through gamification.
          </p>
        </div>
      </div>
    </div>
  );
}
