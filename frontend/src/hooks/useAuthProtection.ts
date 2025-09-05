import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/stores/useUserStore';

interface UseAuthProtectionOptions {
  requireAuth?: boolean;
  redirectTo?: string;
  redirectUnauthenticatedTo?: string;
  redirectAuthenticatedTo?: string;
}

/**
 * Hook for protecting pages with authentication
 * @param options Configuration options for auth protection
 * @returns Auth state and loading status
 */
export function useAuthProtection(options: UseAuthProtectionOptions = {}) {
  const {
    requireAuth = true,
    redirectUnauthenticatedTo = '/login',
    redirectAuthenticatedTo,
  } = options;

  const router = useRouter();
  const { 
    isAuthenticated, 
    isInitialized, 
    isLoading, 
    initializeAuth,
    user 
  } = useUserStore();

  // Initialize auth on mount
  useEffect(() => {
    if (!isInitialized) {
      initializeAuth();
    }
  }, [isInitialized, initializeAuth]);

  // Handle redirections
  useEffect(() => {
    if (!isInitialized || isLoading) return;

    if (requireAuth && !isAuthenticated) {
      // Redirect unauthenticated users
      router.push(redirectUnauthenticatedTo);
    } else if (!requireAuth && isAuthenticated && redirectAuthenticatedTo) {
      // Redirect authenticated users (for login/register pages)
      router.push(redirectAuthenticatedTo);
    }
  }, [
    isInitialized, 
    isLoading, 
    isAuthenticated, 
    requireAuth, 
    redirectUnauthenticatedTo, 
    redirectAuthenticatedTo, 
    router
  ]);

  const shouldShowLoading = isLoading || !isInitialized;
  const shouldRedirect = requireAuth ? !isAuthenticated : (isAuthenticated && redirectAuthenticatedTo);

  return {
    isAuthenticated,
    isInitialized,
    isLoading: shouldShowLoading,
    shouldRedirect,
    user,
  };
}

/**
 * Hook for pages that require authentication
 */
export function useRequireAuth() {
  return useAuthProtection({ requireAuth: true });
}

/**
 * Hook for pages that should redirect authenticated users (login/register)
 */
export function useRedirectIfAuthenticated(redirectTo: string = '/dashboard') {
  return useAuthProtection({ 
    requireAuth: false, 
    redirectAuthenticatedTo: redirectTo 
  });
}