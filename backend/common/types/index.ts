export interface TokenData {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
}

export interface SubjectStats {
  totalTopics: number;
  totalQuestions: number;
  averageScore: number;
  completionRate: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}