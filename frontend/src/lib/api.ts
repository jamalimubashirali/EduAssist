import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'
import { toast } from 'sonner'

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1' 

// Create axios instance (always real API)
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000, // Increased timeout for assessment generation
  withCredentials: true, // cookie-based auth
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // No need to manually attach tokens - cookies are sent automatically
    // All authentication is handled via HTTP-only cookies
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: any) => {
    const originalRequest = error.config as any

    // Handle 401 errors (unauthorized) with cookie-based refresh
    if (error.response?.status === 401 && !originalRequest?._retry) {
      // Skip refresh for login, register, and refresh endpoints to avoid infinite loops
      const skipRefreshUrls = ['/auth/login', '/auth/register', '/auth/refresh']
      if (skipRefreshUrls.some(url => originalRequest.url?.includes(url))) {
        return Promise.reject(error)
      }

      originalRequest._retry = true
      try {
        await api.post('/auth/refresh')
        return api(originalRequest)      } catch (refreshError) {
        // Clear any remaining client-side auth state and redirect
        // No localStorage tokens to clear since we use HTTP-only cookies
        // if (!authRedirectManager.isOnLoginPage()) {
        //   authRedirectManager.redirectToLogin()
        // }
        return Promise.reject(refreshError)
      }
    }

    // Handle other errors consistently
    if (error.response?.status === 403) toast.error('Access denied.')
    else if (error.response?.status === 404) toast.error('Resource not found.')
    else if (error.response?.status >= 500) toast.error('Server error. Please try again later.')
    else if (error.code === 'ECONNABORTED') toast.error('Request timeout. Please check your connection.')
    else if (!error.response) toast.error('Network error. Please check your internet connection.')

    return Promise.reject(error)
  }
)

export interface ApiResponse<T = any> { data: T; message?: string; success?: boolean }
export interface ApiError { message: string; statusCode?: number; error?: string }
export const handleApiResponse = <T>(response: AxiosResponse<T>): T => response.data
export const handleApiError = (error: AxiosError<ApiError>): never => { throw new Error(error.response?.data?.message || error.message || 'An unexpected error occurred') }
export default api