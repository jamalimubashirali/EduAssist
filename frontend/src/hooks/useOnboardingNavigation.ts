import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/stores/useUserStore';
import { userService } from '@/services/userService';
import { OnboardingStep, User } from '@/types';

interface UseOnboardingNavigationProps {
  currentStep: OnboardingStep;
  nextStep?: OnboardingStep | 'dashboard';
  isFinalStep?: boolean;
}

export function useOnboardingNavigation({
  currentStep,
  nextStep,
  isFinalStep = false,
}: UseOnboardingNavigationProps) {
  const router = useRouter();
  const { user, setUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = async (data?: Record<string, any>) => {
    // Wait for user data to be available if it's still loading
    // const { isLoading: userLoading, isInitialized } = useUserStore.getState();

    // console.log(user);
    
    // if (userLoading || !isInitialized) {
    //   setError('Please wait while we load your profile...');
    //   return;
    // }

    if (!user) {
      console.error('No user found in useOnboardingNavigation');
      setError('User session not found. Please refresh the page.');
      return;
    }

    if (!user.id) {
      console.error('User ID missing:', user);
      setError('Invalid user session. Please log in again.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Updating onboarding step:', {
        userId: user.id,
        currentStep,
        nextStep,
        data
      });

      const payload = {
        step: (nextStep && nextStep !== 'dashboard' ? nextStep : currentStep).toUpperCase(),
        ...data,
      };
      
      const updatedUser = await userService.updateOnboarding(user.id, payload);
      console.log('Onboarding updated successfully:', updatedUser);
      
      setUser(updatedUser as User);

      if (isFinalStep) {
        router.push('/dashboard');
      } else if (nextStep) {
        router.push(`/onboarding/${nextStep}`);
      }
    } catch (err: any) {
      console.error('Failed to update onboarding step:', err);
      const errorMessage = err.response?.data?.message || err.message || 'An unexpected error occurred.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return { handleNext, isLoading, error };
}
