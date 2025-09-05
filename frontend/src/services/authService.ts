import api, { handleApiResponse, handleApiError } from '@/lib/api'
import { User } from '@/types'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  message: string
  user?: User
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
}

class AuthService {
  // Register new user
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/register', data)
      return handleApiResponse(response)
    } catch (error: any) {
      // Bubble up a consistent error to caller
      return handleApiError(error)
    }
  }

  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/login', credentials)
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Logout user
  async logout(): Promise<{ message: string }> {
    try {
      // For HTTP-only cookies, the logout call will clear server-side cookies
      const response = await api.post('/auth/logout')
      return handleApiResponse(response)
    } catch (error: any) {
      // Even if API call fails, cookies should be cleared by browser
      return { message: 'Logout successful' }
    }
  }

  // Refresh session
  async refreshSession(): Promise<TokenResponse> {
    try {
      const response = await api.post('/auth/refresh-session')
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Check auth status (public endpoint)
  async getAuthStatus(): Promise<{ 
    isAuthenticated: boolean; 
    user?: User; 
    needsRefresh?: boolean 
  }> {
    try {
      const response = await api.get('/auth/status')
      const result = handleApiResponse(response)
      
      // If needs refresh, automatically refresh tokens
      if (result.needsRefresh) {
        try {
          await api.post('/auth/refresh')
          // After refresh, get updated status
          const refreshedResponse = await api.get('/auth/status')
          return handleApiResponse(refreshedResponse)
        } catch (refreshError) {
          console.error('Auto-refresh failed:', refreshError)
          return { isAuthenticated: false }
        }
      }
      
      return result
    } catch (error: any) {
      return { isAuthenticated: false }
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get('/users/me')
      return handleApiResponse(response)
    } catch (error: any) {
      return handleApiError(error)
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    // For HTTP-only cookies, we can't check client-side
    // Authentication state should be managed by the AuthContext
    // This method should not be used for HTTP-only cookie auth
    return false
  }

  // Clear authentication data
  clearAuth(): void {
    // For HTTP-only cookies, we can't clear them client-side
    // This will be handled by the logout endpoint
    // No action needed here
  }
}

export const authService = new AuthService()
export default authService
